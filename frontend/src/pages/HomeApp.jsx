import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { MainLayout } from './MainLayout';
import { Dashboard } from '../components/Dashboard';
import { EqList } from '../components/EqList';
import { ByLocation } from '../components/ByLocation';
import { EqDetail } from '../components/EqDetail';
import { MoveModal, ObsModal, NewEqModal, StatusModal } from '../components/Modals';
import { useRealtime } from '../hooks/useRealtime';

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
  const [statusModal, setStatusModal] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

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

  useRealtime(() => {
    console.log("Real-time update received!");
    reloadAll();
  });

  useEffect(() => {
    loadEquipments();
  }, [view]);

  useEffect(() => {
    if (reqView && reqView !== view) {
      setView(reqView);
    }
  }, [reqView]);

  const reqAction = searchParams.get('action');

  useEffect(() => {
    if (requestedEq && eq.length > 0) {
      const target = eq.find(e => e.id === requestedEq);
      if (target) {
        setSelEq(target);
        setView("detail");
        
        if (reqAction === 'defeito') {
          setObsModal({ eq: target, cat: 'defeito' });
        }
        if (reqAction === 'status') {
          setStatusModal(target);
        }

        // Clean up URL
        navigate('/', { replace: true });
      }
    }
  }, [requestedEq, eq, navigate, reqAction]);

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
      {statusModal && <StatusModal e={statusModal} onSave={reloadAll} onClose={() => setStatusModal(null)} />}
    </MainLayout>
  );
};
