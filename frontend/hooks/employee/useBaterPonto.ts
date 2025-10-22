import { useAuth } from "@/contexts/AuthContext";
import { ModelFuncionario } from "@/models/ModelFuncionario";
import api from "@/services/api";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react"


export const baterPonto = () => {
   const [loading, SetLoading] = useState(true);
   const { userId } = useAuth();
   const [funcionario, setFuncionario] = useState<ModelFuncionario>();


   const fetchFuncionario = useCallback(() => {
      SetLoading(true);
      api.get(`/funcionarios/id?funcionarioId=${userId}`)
         .then(response => {
            if (response.data && response.data) {
               setFuncionario(response.data);
            }
         })
         .catch(error => {
            console.error("Erro ao buscar dados do funcionário:", error);
         })
         .finally(() => {
            SetLoading(false);
         });

   }, []);



   useFocusEffect(fetchFuncionario);

   return { loading, funcionario };

}