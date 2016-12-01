// @flow
import {shell, remote, ipcRenderer} from 'electron'
import React, {Component} from 'react'
import {connect} from 'react-redux'
import css from 'react-css-modules'
import {download} from 'electron-dl'
import type {Illust, User} from '../../types/'
import BoxHeader from './BoxHeaderContainer'
import BoxFooter from './box-footer'
import BoxImage from './box-image'
import styles from './box.css'

const {Menu, MenuItem} = remote

type Props = {
	illust: Illust,
	user: User,
	isIllustOnly: bool,
	onClick: () => void,
	onClickUser: () => void,
	onClickTag: (tag: string) => void,
	addBookmark: (id: number, isPublic: bool) => void
};

@css(styles)
class Box extends Component {
	props: Props;

	shouldComponentUpdate(nextProps: Props) {
		return (
			nextProps.illust.id !== this.props.illust.id ||
			nextProps.isIllustOnly !== this.props.isIllustOnly
		)
	}

	handleContextMenu = (e: Event) => {
		e.preventDefault()

		const {illust, user, onClickUser, addBookmark} = this.props
		const {id, title, imageUrls, metaSinglePage} = illust
		const img = imageUrls.large
		const name = user.name

		const menu = new Menu()

		menu.append(new MenuItem({
			label: 'オリジナルサイズの画像を保存',
			click(item, win) {
				download(win, img)
			},
		}))

		menu.append(new MenuItem({type: 'separator'}))

		menu.append(new MenuItem({
			label: 'このユーザの情報を見る',
			click() {
				onClickUser(user.id)
			},
		}))

		menu.append(new MenuItem({type: 'separator'}))

		menu.append(new MenuItem({
			label: 'ブックマーク',
			click: () => {
				addBookmark(id, true)
			},
		}))

		menu.append(new MenuItem({
			label: '非公開ブックマーク',
			click: () => {
				addBookmark(id, false)
			},
		}))

		menu.append(new MenuItem({type: 'separator'}))

		menu.append(new MenuItem({
			label: 'Twitterで共有',
			click() {
				const encodedTitle = encodeURIComponent(title)
				const encodedName = encodeURIComponent(name)
				const url = `https://twitter.com/intent/tweet?original_referer=http%3A%2F%2Fwww.pixiv.net%2Fmember_illust.php%3Fmode%3Dmedium%26illust_id%3D${id}&ref_src=twsrc%5Etfw&text=${encodedTitle}%20%7C%20${encodedName}%20%23pixiv%20%23PixivDeck&tw_p=tweetbutton&url=http%3A%2F%2Fwww.pixiv.net%2Fmember_illust.php%3Fillust_id%3D${id}%26mode%3Dmedium`
				ipcRenderer.send('tweet', url)
			},
		}))

		menu.append(new MenuItem({
			label: 'pixivで開く',
			click() {
				shell.openExternal(`http://www.pixiv.net/member_illust.php?mode=medium&illust_id=${id}`)
			},
		}))

		menu.append(new MenuItem({type: 'separator'}))

		menu.append(new MenuItem({
			label: '壁紙に設定',
			click() {
				const img = metaSinglePage.originalImageUrl
				if (img) {
					ipcRenderer.send('wallpaper', img)
				} else {
					ipcRenderer.send('wallpaper', imageUrls.large)
				}
			},
		}))

		menu.popup(remote.getCurrentWindow())
	}

	render() {
		const {illust, user, onClick, onClickTag, onClickUser, isIllustOnly} = this.props
		const {title, caption} = illust
		const tags = illust.tags.map(x => x.name)

		return (
			<div styleName="box" onContextMenu={this.handleContextMenu}>
				{!isIllustOnly &&
					<BoxHeader
						name={user.name}
						account={user.account}
						img={user.profileImageUrls.medium}
						title={title}
						caption={caption}
						onClick={onClickUser}
						/>
				}
				<BoxImage illust={illust} onClick={onClick}/>
				{!isIllustOnly &&
					<BoxFooter tags={tags} onClickTag={onClickTag}/>
				}
			</div>
		)
	}
}

export default connect()(Box)