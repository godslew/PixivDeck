// @flow
import React, {Component} from 'react'
import isEqual from 'lodash.isequal'
import type {Illust, ColumnType} from '../../types'
import ColumnList from './ColumnList'
import styles from './Column.css'

type Props = {
	illusts: Array<Illust>,
	column: ColumnType,
	onClose: () => void,
	onReload: () => void,
	onNextPage: () => void
};

export default class Column extends Component {
	props: Props;

	shouldComponentUpdate(nextProps: Props) {
		return !isEqual(this.props.illusts, nextProps.illusts)
	}

	render() {
		const {column, ...othres} = this.props
		return (
			<div className={styles.base}>
				<ColumnList
					id={column.id}
					title={column.title}
					{...othres}
					/>
			</div>
		)
	}
}
