import React, { useState } from 'react';
import { User, Palette, Lock, Bell, Globe, ChevronRight, Building2 } from 'lucide-react';
import styles from './Settings.module.css';
import { ProfileTab } from './ProfileTab';
import { CompanyTab } from './CompanyTab';
import { AppearanceTab } from './AppearanceTab';
import { SecurityTab } from './SecurityTab';
import { NotificationsTab } from './NotificationsTab';
import { LanguageTab } from './LanguageTab';
import { useAuthContext } from '@/contexts/AuthContext';

type TabType = 'profile' | 'company' | 'appearance' | 'security' | 'notifications' | 'language';

const Settings: React.FC = () => {
    const { isOwner } = useAuthContext();
    const [activeTab, setActiveTab] = useState<TabType>('profile');

    const tabs = [
        { id: 'profile', label: 'Perfil', icon: User, visible: true },
        { id: 'company', label: 'Imobiliária', icon: Building2, visible: isOwner },
        { id: 'appearance', label: 'Aparência', icon: Palette, visible: true },
        { id: 'security', label: 'Segurança', icon: Lock, visible: true },
        { id: 'notifications', label: 'Notificações', icon: Bell, visible: true },
        { id: 'language', label: 'Idioma', icon: Globe, visible: true },
    ].filter(tab => tab.visible);

    const renderContent = () => {
        switch (activeTab) {
            case 'profile': return <ProfileTab />;
            case 'company': return <CompanyTab />;
            case 'appearance': return <AppearanceTab />;
            case 'security': return <SecurityTab />;
            case 'notifications': return <NotificationsTab />;
            case 'language': return <LanguageTab />;
            default: return <ProfileTab />;
        }
    };

    const getActiveTabLabel = () => tabs.find(t => t.id === activeTab)?.label;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Configurações</h1>
                <p className={styles.subtitle}>Gerencie suas informações pessoais, segurança e preferências do sistema.</p>
            </header>

            <div className={styles.layout}>
                <aside className={styles.sidebar}>
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`${styles.tabButton} ${activeTab === tab.id ? styles.activeTab : ''}`}
                            >
                                <Icon size={20} />
                                <span>{tab.label}</span>
                                {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
                            </button>
                        );
                    })}
                </aside>

                <main className={styles.content}>
                    <div className="flex items-center gap-2 mb-6 md:hidden">
                        <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                            {getActiveTabLabel()}
                        </span>
                    </div>
                    <h2 className={styles.sectionTitle}>{getActiveTabLabel()}</h2>
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default Settings;
