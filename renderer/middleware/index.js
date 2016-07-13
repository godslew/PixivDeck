// @flow
import type {Store, Dispatch, Action} from 'redux';

export const save = (store: Store) => (next: Dispatch) => (action: Action) => {
	if (action.id) {
		setImmediate(() => {
			localStorage.setItem('store', JSON.stringify(store.getState()));
		});
	}
	next(action);
};
