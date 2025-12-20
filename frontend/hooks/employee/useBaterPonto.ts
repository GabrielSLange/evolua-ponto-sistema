import { useAuth } from "@/contexts/AuthContext";
import { ModelFuncionario } from "@/models/ModelFuncionario";
import api from "@/services/api";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react"


export const baterPonto = () => {
   const [loading, SetLoading] = useState(true);
   const { userId } = useAuth();
   const [funcionario, setFuncionario] = useState<ModelFuncionario>();
   const [tipoBatida, setTipoBatida] = useState<string>();


   const carregarDados = async (idDoUsuario: string) => {
      try {
         SetLoading(true);
         
         // Busca Funcionario
         const responseFunc = await api.get(`/funcionarios/id?funcionarioId=${idDoUsuario}`);
         const dadosFuncionario = responseFunc.data;

         if (dadosFuncionario) {
            setFuncionario(dadosFuncionario);
            
            const responsePonto = await api.get(`/RegistroPonto/ultimoPonto?funcionarioId=${dadosFuncionario.id}`);
            
            if (responsePonto.data) {
               const ultimoTipo = responsePonto.data.data || responsePonto.data; 
               setTipoBatida(ultimoTipo);
            }
         }
      } catch (error) {
         console.error("Erro ao carregar dados:", error);
      } finally {
         SetLoading(false);
      }
   };
   useEffect(() => {
      if (userId) {
         carregarDados(userId);
      }
   }, [userId]);
   useFocusEffect(
      useCallback(() => {
         if (userId) {
             carregarDados(userId);
         }
      }, [userId])
   );

   return { loading, funcionario, tipoBatida,  SetLoading };

}