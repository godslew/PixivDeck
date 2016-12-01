// @flow
import url from 'url'
import type {
	State,
	Action,
	Dispatch,
	Illust,
	ColumnType,
	Params,
} from '../types'
import Pixiv, {normalizeIllusts} from '../repo/pixiv'
import {getColumn} from '../reducers'
import {selectIllusts, addColumnIllusts, setPrams,
	nextColumnIllusts,
} from './column'

type UserIllust = | 'illust' | 'manga';

export async function fetchUserDetail(id: number) {
	return await Pixiv.userDetail(id)
}

const apiRequestSuccess = (response: Object): Action => ({type: 'API_REQUEST_SUCCESS', response})

export function fetchUserIllust(id: number, type?: UserIllust = 'illust') {
	return async (dispatch: Dispatch): Promise<Array<Illust>> => {
		const rawData = await Pixiv.userIllusts(id, {type})
		const response = normalizeIllusts(rawData)

		dispatch(apiRequestSuccess(response))

		return selectIllusts(response.result, response.entities.illusts)
	}
}

export function addBookmark(id: number, isPublic?: bool = true) {
	return async (dispatch: Dispatch, getState: () => State): Promise<void> => {
		const opts = isPublic ? {} : {restrict: 'private'}
		await Pixiv.illustBookmarkAdd(id, opts)
		const columns = getState().columns.filter(c => c.endpoint === 'userBookmarksIllust')
		for (const c of columns) {
			await dispatch(fetchColumn(c, false))
		}
	}
}

async function fetchPixiv({endpoint, query}: ColumnType): Promise<{response: Object, params: ?Object}> {
	const {id, opts, word} = query
	let res
	if (endpoint === 'illustRanking') {
		res = await Pixiv.illustRanking(opts)
	} else if (endpoint === 'illustFollow') {
		res = await Pixiv.illustFollow(opts)
	} else if (endpoint === 'userBookmarksIllust') {
		const myId = Pixiv.authInfo().user.id
		res = await Pixiv.userBookmarksIllust(myId, opts)
	} else if (endpoint === 'userIllusts') {
		if (!id) {
			throw new Error('required id')
		}
		res = await Pixiv.userIllusts(id, opts)
	} else if (endpoint === 'searchIllust') {
		if (!word) {
			throw new Error('required word')
		}
		res = await Pixiv.searchIllust(word, opts)
	} else {
		res = await Pixiv.fetch(endpoint, opts)
	}

	const params: ?Params = res.nextUrl ? url.parse(res.nextUrl, true).query : null
	return {
		response: normalizeIllusts(res),
		params,
	}
}

export const nextPage = (id: number) => {
	return async (dispatch: Dispatch, getState: () => State): Promise<void> => {
		const column = getColumn(getState(), id)
		const {response, params} = await fetchPixiv(column)
		dispatch(apiRequestSuccess(response))
		dispatch(nextColumnIllusts(id, response.result))
		if (params) {
			dispatch(setPrams(id, params))
		}
	}
}

export function fetchColumn(column: ColumnType, updateQuery?: bool = true) {
	return async (dispatch: Dispatch, getState: () => State): Promise<void> => {
		const {id} = column
		const authInfo = Pixiv.authInfo()
		const {auth: {username, password}} = getState()
		if (!authInfo && username && password) {
			await Pixiv.login(username, password)
		}
		if (!updateQuery && column.query.opts) {
			delete column.query.opts.max_bookmark_id
			column.query.opts.offset = 0
		}
		const {response, params} = await fetchPixiv(column)
		dispatch(apiRequestSuccess(response))
		dispatch(addColumnIllusts(column.id, response.result))

		if (params && updateQuery) {
			dispatch(setPrams(id, params))
		}
	}
}