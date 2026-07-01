import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from './MainLayout';
import { Dashboard } from '../components/Dashboard';
import { EqList } from '../components/EqList';
import { ByLocation } from '../components/ByLocation';
import { EqDetail } from '../components/EqDetail';
import { MoveModal, ObsModal, NewEqModal } from '../components/Modals';

export const HomeApp = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedEq = searchParams.get('eq');
  const reqView = searchParams.get('view');

  const [eq, setEq] = useState([]);
  const [view, setView] = useState(reqView || "dashboard");
  const [selEq, setSelEq] = useState(null);
  
  const [moveEq,  setMoveEq]  = useState(null);
  const [obsModal, setObsModal] = useState({ eq: null, cat: "observacao" });
  const [showNew, setShowNew] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadEquipments();
  }, [view]);

  useEffect(() => {
    if (reqView && reqView !== view) {
      setView(reqView);
    }
  }, [reqView]);

  useEffect(() => {
    if (requestedEq && eq.length > 0) {
      const target = eq.find(e => e.id === requestedEq);
      if (target) {
        setSelEq(target);
        setView("detail");
        // Clear the URL query param so a reload doesn't force it again
        navigate('/', { replace: true });
      }
    }
  }, [requestedEq, eq, navigate]);

  const loadEquipments = async () => {
    try {
      const res = await api.get('/equipments');
      setEq(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const reloadAll = () => {
    loadEquipments();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <MainLayout view={view} setView={setView} setSelEq={setSelEq}>
      {view === "dashboard" && <Dashboard eq={eq} onSelect={e => { setSelEq(e); setView("detail"); }} />}
      {view === "list" && <EqList eq={eq} onSelect={e => { setSelEq(e); setView("detail"); }} onNew={() => setShowNew(true)} userRole={user?.role?.name} />}
      {view === "location" && <ByLocation eq={eq} onSelect={e => { setSelEq(e); setView("detail"); }} />}
      {view === "detail" && selEq && (
        <EqDetail e={selEq} refreshKey={refreshKey}
          onBack={() => { setSelEq(null); setView("list"); reloadAll(); }}
          onMove={e => setMoveEq(e)}
          onObs={(e, cat) => setObsModal({ eq: e, cat })}
        />
      )}

      {moveEq && <MoveModal e={moveEq} onSave={reloadAll} onClose={() => setMoveEq(null)} />}
      {obsModal.eq && <ObsModal e={obsModal.eq} initCat={obsModal.cat} onSave={reloadAll} onClose={() => setObsModal({ eq: null, cat: "observacao" })} />}
      {showNew && <NewEqModal eqList={eq} onSave={reloadAll} onClose={() => setShowNew(false)} />}
    </MainLayout>
  );
};
