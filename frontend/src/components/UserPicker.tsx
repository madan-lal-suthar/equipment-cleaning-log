import { setCurrentUserId } from '../store/actions';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectCurrentUser } from '../store/selectors';

/** "Signed in as" selector for the header-based auth stand-in. */
export function UserPicker() {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.users.items);
  const isLoading = useAppSelector((state) => state.users.isLoading);
  const currentUser = useAppSelector(selectCurrentUser);

  if (isLoading) return <span className="muted">Loading users…</span>;
  if (users.length === 0) return <span className="muted">No users — run the seed script.</span>;

  return (
    <label className="user-picker">
      Signed in as
      <select
        value={currentUser?.id ?? ''}
        onChange={(event) => dispatch(setCurrentUserId(event.target.value))}
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
    </label>
  );
}
