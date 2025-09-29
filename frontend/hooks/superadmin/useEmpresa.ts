import { useState, useCallback, useEffect } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import api from "../../services/api";
import { ModelEmpresa } from "@/models/ModelEmpresa";
import { isAxiosError } from "axios";
import { useNotification } from '../../contexts/NotificationContext';


//Tela de index do superadmin (listagem de empresas)
export const useEmpresa = () => {
   const [empresas, setEmpresas] = useState<ModelEmpresa[]>([]);
   const [loading, setLoading] = useState(true);

   const fetchEmpresas = useCallback(() => {
      setLoading(true);
      api.get('/Empresas')
         .then(response => {
            if (response.data && response.data)
               setEmpresas(response.data);
         })
         .catch(error => {
            console.error("Erro ao buscar empresas:", error);
         })
         .finally(() => {
            setLoading(false);
         });
   }, []);

   //Teste

   const toggleEmpresaAtivo = async (id: string) => {
      // Guarda o estado original caso a API falhe
      const originalEmpresas = [...empresas];

      // 1. Atualiza a UI instantaneamente (a parte "otimista")
      setEmpresas(currentEmpresas =>
         currentEmpresas.map(empresa =>
            empresa.id === id ? { ...empresa, ativo: !empresa.ativo } : empresa
         )
      );

      // 2. Tenta sincronizar com o backend em segundo plano
      try {
         await api.patch(`/empresas?Id=${id}`);
      } catch (error) {
         console.error("Falha ao atualizar status da empresa:", error);
         // 3. Se a API falhar, reverte a mudança na UI
         setEmpresas(originalEmpresas);
         // Aqui você pode mostrar um snackbar de erro
      }
   };

   const formatCNPJ = (cnpj: string) => {
      if (!cnpj) return '';

      // Remove qualquer caractere que não seja número
      const digitsOnly = cnpj.replace(/\D/g, '');

      // Aplica a máscara e retorna a string formatada
      return digitsOnly.replace(
         /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
         '$1.$2.$3/$4-$5'
      );
   };

   useFocusEffect(fetchEmpresas);

   return { empresas, loading, toggleEmpresaAtivo, formatCNPJ };
}

// Tela de add-empresa
export const useCreateEmpresa = () => {
   const [loading, setLoading] = useState(false);
   const router = useRouter();
   const { showNotification } = useNotification();

   const addEmpresa = async (empresa: ModelEmpresa) => {
      setLoading(true);
      try {
         empresa.id = undefined;
         await api.post('/empresas', empresa);
         router.back();
      }
      catch (error) {
         if (isAxiosError(error) && error.response) {
            const apiMessage = error.response.data || "Erro desconhecido da API";
            showNotification(apiMessage, "error");
         }
      }
      finally {
         setLoading(false);
      }
   }
   return [loading, addEmpresa] as const;
}

// Tela de edit-empresa
export const useEditEmpresa = (empresaId: string) => {
   const [loading, setLoading] = useState(false);
   const [empresa, setEmpresa] = useState<ModelEmpresa | null>(null);
   const router = useRouter();
   const { showNotification } = useNotification();


   useEffect(() => {
      if (empresaId) {
         setLoading(true);
         api.get(`/empresas/${empresaId}`)
            .then(response => {
               if (response.data && response.data) {
                  setEmpresa(response.data);
               }
            })
            .catch(error => console.error("Erro ao buscar dados da empresa:", error))
            .finally(() => setLoading(false));
      }
   }, [empresaId]);

   const updateEmpresa = async (data: ModelEmpresa) => {
      setLoading(true);
      try {
         await api.put(`/empresas/`, data);
         router.back(); // Volta para a lista após a atualização
      } catch (error) {
         if (isAxiosError(error) && error.response) {
            const apiMessage = error.response.data || "Erro desconhecido da API";
            showNotification(apiMessage, "error");
         }
      } finally {
         setLoading(false);
      }
   }
   return { loading, empresa, updateEmpresa } as const;
};