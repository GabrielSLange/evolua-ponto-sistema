import { useAuth } from "@/contexts/AuthContext";
import { ModelFuncionario } from "@/models/ModelFuncionario";
import api from "@/services/api";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";


export const relatorios = () => {
  const { userId } = useAuth();
  const [loading, SetLoading] = useState(true);
  const [funcionarios, setFuncionarios] = useState<ModelFuncionario[]>();
  const [estabelecimentoId, setEstabelecimentoId] = useState<string>();
  

  const carregarDados = async (idDoUsuario: string) => {
    try {
      SetLoading(true);
      
      const responseFunc = await api.get(`/funcionarios/id?funcionarioId=${idDoUsuario}`);
      const dadosFuncionario = responseFunc.data;

      if (dadosFuncionario) {
        setEstabelecimentoId(dadosFuncionario?.estabelecimento?.id);

        const responseFuncionarios = await api.get(`/funcionarios?empresaId=${dadosFuncionario?.estabelecimento?.empresaId}`);
        
        if (responseFuncionarios.data) {
          setFuncionarios(responseFuncionarios.data);
        }
      }      
    } catch (error) {
      console.error("Erro ao carregar dados de relatórios:", error);
    }
    finally {
      SetLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      carregarDados(userId);
    }
  }, [userId, estabelecimentoId]);
  useFocusEffect(
        useCallback(() => {
           if (userId) {
               carregarDados(userId);
           }
        }, [userId, estabelecimentoId])
     );

  return { loading, funcionarios, estabelecimentoId, SetLoading };
}