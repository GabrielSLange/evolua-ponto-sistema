import React, { createContext, useState, useContext, ReactNode } from 'react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationContextData {
   showNotification: (message: string, type?: NotificationType) => void;
}

// **A CORREÇÃO É AQUI**
// Adicionamos a propriedade 'onDismiss' à nossa interface de estado.
interface NotificationState {
   visible: boolean;
   message: string;
   type: NotificationType;
   onDismiss: () => void; // <-- Propriedade adicionada
}

export const NotificationStateContext = createContext<NotificationState | undefined>(undefined);
export const NotificationContext = createContext<NotificationContextData | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
   const [notificationState, setNotificationState] = useState({
      visible: false,
      message: '',
      type: 'info' as NotificationType,
   });

   const showNotification = (message: string, type: NotificationType = 'info') => {
      setNotificationState({ visible: true, message, type });
   };

   const hideNotification = () => {
      setNotificationState((prevState) => ({ ...prevState, visible: false }));
   };

   // O valor agora corresponde perfeitamente à interface NotificationState
   const stateValue: NotificationState = {
      ...notificationState,
      onDismiss: hideNotification
   };

   return (
      <NotificationContext.Provider value={{ showNotification }}>
         <NotificationStateContext.Provider value={stateValue}>
            {children}
         </NotificationStateContext.Provider>
      </NotificationContext.Provider>
   );
};

export const useNotification = () => {
   const context = useContext(NotificationContext);
   if (!context) {
      throw new Error('useNotification deve ser usado dentro de um NotificationProvider');
   }
   return context;
};