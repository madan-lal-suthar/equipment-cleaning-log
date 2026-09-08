import { useEffect } from 'react';
import { CleaningRecordsPanel } from './components/CleaningRecordsPanel';
import { EquipmentList } from './components/EquipmentList';
import { UserPicker } from './components/UserPicker';
import { fetchUsers } from './store/actions';
import { useAppDispatch, useAppSelector } from './store/hooks';

export default function App() {
  const dispatch = useAppDispatch();
  const selectedId = useAppSelector((state) => state.ui.selectedEquipmentId);

  useEffect(() => {
    void dispatch(fetchUsers());
  }, [dispatch]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>Equipment Cleaning Log</h1>
        <UserPicker />
      </header>

      <main className="app__body">
        <EquipmentList />

        {selectedId ? (
          <CleaningRecordsPanel />
        ) : (
          <section className="panel panel--empty">
            <p className="muted">Select a piece of equipment to see its cleaning records.</p>
          </section>
        )}
      </main>
    </div>
  );
}
