// Em: services/eventBus.ts
// (Não use DeviceEventEmitter, pois não funciona na web)

type Listener = (payload: any) => void;

class EventBus {
   private listeners: { [key: string]: Listener[] } = {};

   /**
    * Ouve um evento
    */
   on(event: string, listener: Listener) {
      if (!this.listeners[event]) {
         this.listeners[event] = [];
      }
      this.listeners[event].push(listener);
   }

   /**
    * Para de ouvir um evento
    */
   off(event: string, listener: Listener) {
      if (!this.listeners[event]) return;
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
   }

   /**
    * Dispara um evento
    */
   emit(event: string, payload: any) {
      if (!this.listeners[event]) return;
      this.listeners[event].forEach(listener => listener(payload));
   }
}

// Exporta uma única instância global
export const eventBus = new EventBus();