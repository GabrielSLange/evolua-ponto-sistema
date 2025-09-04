import { useState, useCallback, useEffect } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import api from "../../services/api";
import { ModelEmpresa } from "@/models/ModelEmpresa";


//Tela de index do superadmin (listagem de empresas)
export const useEmpresa = () => {
   const [empresas, setEmpresas] = useState<ModelEmpresa[]>([]);
   const [loading, setLoading] = useState(true);

   const fetchEmpresas = useCallback(() => {
      setLoading(true);
      api.get('/empresas')
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

   useFocusEffect(fetchEmpresas);

   return { empresas, loading };
}

// Tela de add-empresa
export const useCreateEmpresa = () => {
   const [loading, setLoading] = useState(false);
   const router = useRouter();

   const addEmpresa = async (data: ModelEmpresa) => {
      setLoading(true);
      try {
         await api.post('/empresas', {
            razaoSocial: data.razaoSocial,
            cnpj: data.cnpj,
         });
         router.back();
      }
      catch (error) {
         console.error("Erro ao criar empresa:", error);
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
         console.error("Erro ao atualizar empresa:", error);
         // Adicionar feedback de erro
      } finally {
         setLoading(false);
      }
   }
   return { loading, empresa, updateEmpresa } as const;
};