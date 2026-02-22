import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import './AdminPanel.css';

// Import sections
import DashboardSection from './admin/DashboardSection';
import ForumsSection from './admin/ForumsSection';
import ThreadsSection from './admin/ThreadsSection';
import PluginsSection from './admin/PluginsSection';
import UsersSection from './admin/UsersSection';
import GroupsSection from './admin/GroupsSection';
import PermissionsSection from './admin/PermissionsSection';
import ModeratorsSection from './admin/ModeratorsSection';
import WarningsSection from './admin/WarningsSection';
import ReportsSection from './admin/ReportsSection';
import NoticesSection from './admin/NoticesSection';
import AppearanceSection from './admin/AppearanceSection';
import BannersSection from './admin/BannersSection';
import SettingsSection from './admin/SettingsSection';
import EmailSection from './admin/EmailSection';
import SecuritySection from './admin/SecuritySection';
import ToolsSection from './admin/ToolsSection';
import LogsSection from './admin/LogsSection';
import BackupSection from './admin/BackupSection';
import AdminModal from './admin/AdminModal';

function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // Data states
  const [threads, setThreads] = useState([]);
  const [users, setUsers] = useState([]);
  const [plugins, setPlugins] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({});
  const [groups, setGroups] = useState([]);
  const [moderators, setModerators] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [reports, setReports] = useState([]);
  const [notices, setNotices] = useState([]);
  const [settings, setSettings] = useState({});
  const [logs, setLogs] = useState([]);
  const [backups, setBackups] = useState([]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      const urls = [
        'http://localhost:3001/api/admin/threads',
        'http://localhost:3001/api/admin/users',
        'http://localhost:3001/api/admin/plugins',
        'http://localhost:3001/api/admin/banners',
        'http://localhost:3001/api/categories',
        'http://localhost:3001/api/stats',
        'http://localhost:3001/api/admin/groups',
        'http://localhost:3001/api/admin/moderators',
        'http://localhost:3001/api/admin/warnings',
        'http://localhost:3001/api/admin/reports',
        'http://localhost:3001/api/admin/notices',
        'http://localhost:3001/api/admin/settings',
        'http://localhost:3001/api/admin/logs',
        'http://localhost:3001/api/admin/backups'
      ];
      const results = await Promise.all(urls.map(u => fetch(u).catch(() => ({ json: () => [] })).then(r => r.json().catch(() => []))));
      
      setThreads(Array.isArray(results[0]) ? results[0] : []);
      setUsers(Array.isArray(results[1]) ? results[1] : []);
      setPlugins(Array.isArray(results[2]) ? results[2] : []);
      setBanners(Array.isArray(results[3]) ? results[3] : []);
      setCategories(Array.isArray(results[4]) ? results[4] : []);
      setStats(typeof results[5] === 'object' ? results[5] : {});
      setGroups(Array.isArray(results[6]) && results[6].length > 0 ? results[6] : []);
      setModerators(Array.isArray(results[7]) ? results[7] : []);
      setWarnings(Array.isArray(results[8]) ? results[8] : []);
      setReports(Array.isArray(results[9]) ? results[9] : []);
      setNotices(Array.isArray(results[10]) ? results[10] : []);
      setSettings(typeof results[11] === 'object' ? results[11] : {});
      setLogs(Array.isArray(results[12]) ? results[12] : []);
      setBackups(Array.isArray(results[13]) ? results[13] : []);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleAction = async (action, itemId, data = {}) => {
    try {
      const body = action === 'addPlugin' ? { ...data, author_id: data.author_id || user?.id } : { itemId, ...data };
      const res = await fetch(`http://localhost:3001/api/admin/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const result = await res.json().catch(() => ({}));
      if (result.error) {
        addToast(result.error, 'error');
        return;
      }
      loadData();
      setShowModal(false);
    } catch (error) {
      console.error('Error performing action:', error);
      addToast('Ошибка при выполнении действия', 'error');
    }
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
  };

  const handleGroupAction = async (action, groupId, data = {}) => {
    try {
      const apiAction = action === 'addGroup' ? 'addGroup' : action === 'editGroup' ? 'editGroup' : 'deleteGroup';
      await fetch(`http://localhost:3001/api/admin/${apiAction}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: groupId, ...data })
      });
      const groupsRes = await fetch('http://localhost:3001/api/admin/groups');
      const groupsData = await groupsRes.json();
      setGroups(Array.isArray(groupsData) ? groupsData : groups);
      setShowModal(false);
    } catch (error) {
      console.error('Error:', error);
      addToast('Ошибка при выполнении действия', 'error');
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <h2>Админ-панель</h2>
        </div>
        <nav className="admin-nav">
          <div className="nav-group">
            <div className="nav-group-title">Главная</div>
            <button className={`admin-nav-item ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>Панель управления</button>
          </div>
          <div className="nav-group">
            <div className="nav-group-title">Контент</div>
            <button className={`admin-nav-item ${activeSection === 'forums' ? 'active' : ''}`} onClick={() => setActiveSection('forums')}>Форумы</button>
            <button className={`admin-nav-item ${activeSection === 'threads' ? 'active' : ''}`} onClick={() => setActiveSection('threads')}>Темы</button>
            <button className={`admin-nav-item ${activeSection === 'plugins' ? 'active' : ''}`} onClick={() => setActiveSection('plugins')}>Плагины</button>
          </div>
          <div className="nav-group">
            <div className="nav-group-title">Пользователи</div>
            <button className={`admin-nav-item ${activeSection === 'users' ? 'active' : ''}`} onClick={() => setActiveSection('users')}>Пользователи</button>
            <button className={`admin-nav-item ${activeSection === 'groups' ? 'active' : ''}`} onClick={() => setActiveSection('groups')}>Группы</button>
            <button className={`admin-nav-item ${activeSection === 'permissions' ? 'active' : ''}`} onClick={() => setActiveSection('permissions')}>Права</button>
            <button className={`admin-nav-item ${activeSection === 'moderators' ? 'active' : ''}`} onClick={() => setActiveSection('moderators')}>Модераторы</button>
            <button className={`admin-nav-item ${activeSection === 'warnings' ? 'active' : ''}`} onClick={() => setActiveSection('warnings')}>Предупреждения</button>
            <button className={`admin-nav-item ${activeSection === 'reports' ? 'active' : ''}`} onClick={() => setActiveSection('reports')}>Отчёты</button>
          </div>
          <div className="nav-group">
            <div className="nav-group-title">Оформление</div>
            <button className={`admin-nav-item ${activeSection === 'appearance' ? 'active' : ''}`} onClick={() => setActiveSection('appearance')}>Темы</button>
            <button className={`admin-nav-item ${activeSection === 'banners' ? 'active' : ''}`} onClick={() => setActiveSection('banners')}>Баннеры</button>
            <button className={`admin-nav-item ${activeSection === 'notices' ? 'active' : ''}`} onClick={() => setActiveSection('notices')}>Уведомления</button>
          </div>
          <div className="nav-group">
            <div className="nav-group-title">Система</div>
            <button className={`admin-nav-item ${activeSection === 'settings' ? 'active' : ''}`} onClick={() => setActiveSection('settings')}>Настройки</button>
            <button className={`admin-nav-item ${activeSection === 'email' ? 'active' : ''}`} onClick={() => setActiveSection('email')}>Email</button>
            <button className={`admin-nav-item ${activeSection === 'security' ? 'active' : ''}`} onClick={() => setActiveSection('security')}>Безопасность</button>
            <button className={`admin-nav-item ${activeSection === 'tools' ? 'active' : ''}`} onClick={() => setActiveSection('tools')}>Инструменты</button>
            <button className={`admin-nav-item ${activeSection === 'logs' ? 'active' : ''}`} onClick={() => setActiveSection('logs')}>Логи</button>
            <button className={`admin-nav-item ${activeSection === 'backup' ? 'active' : ''}`} onClick={() => setActiveSection('backup')}>Резервные копии</button>
          </div>
        </nav>
      </div>

      <div className="admin-main">
        {activeSection === 'dashboard' && <DashboardSection stats={stats} onAction={loadData} onNavigate={setActiveSection} />}
        {activeSection === 'forums' && <ForumsSection categories={categories} onAction={openModal} onEdit={openModal} />}
        {activeSection === 'threads' && <ThreadsSection threads={threads} onAction={handleAction} onEdit={openModal} />}
        {activeSection === 'plugins' && <PluginsSection plugins={plugins} onAction={handleAction} onEdit={openModal} />}
        {activeSection === 'users' && <UsersSection users={users} onAction={handleAction} onEdit={openModal} />}
        {activeSection === 'groups' && <GroupsSection groups={groups} onAction={handleGroupAction} onEdit={openModal} />}
        {activeSection === 'permissions' && <PermissionsSection groups={groups} />}
        {activeSection === 'moderators' && <ModeratorsSection moderators={moderators} users={users} onAction={handleAction} loadData={loadData} currentUser={user} />}
        {activeSection === 'warnings' && <WarningsSection warnings={warnings} users={users} onAction={handleAction} loadData={loadData} currentUser={user} />}
        {activeSection === 'reports' && <ReportsSection reports={reports} onAction={handleAction} loadData={loadData} />}
        {activeSection === 'appearance' && <AppearanceSection onAction={openModal} />}
        {activeSection === 'banners' && <BannersSection banners={banners} onAction={handleAction} onEdit={openModal} />}
        {activeSection === 'notices' && <NoticesSection notices={notices} onAction={handleAction} loadData={loadData} />}
        {activeSection === 'settings' && <SettingsSection settings={settings} onSave={handleAction} loadData={loadData} />}
        {activeSection === 'email' && <EmailSection />}
        {activeSection === 'security' && <SecuritySection />}
        {activeSection === 'tools' && <ToolsSection onAction={loadData} />}
        {activeSection === 'logs' && <LogsSection logs={logs} loadData={loadData} />}
        {activeSection === 'backup' && <BackupSection backups={backups} onAction={handleAction} loadData={loadData} />}
      </div>

      {showModal && (
        <AdminModal
          type={modalType}
          item={selectedItem}
          onClose={() => setShowModal(false)}
          onSubmit={(type, id, data) => {
            if (['addGroup', 'editGroup', 'deleteGroup'].includes(type)) {
              handleGroupAction(type, id, data);
            } else {
              handleAction(type, id, data);
            }
          }}
        />
      )}
    </div>
  );
}

export default AdminPanel;
