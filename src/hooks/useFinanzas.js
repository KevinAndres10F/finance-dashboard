import { useState, useEffect, useMemo } from 'react';

const API_URL = "[PEGAR_TU_URL_DE_APPS_SCRIPT_AQUI]";

export function useFinanzas() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            // Simulating API call if URL is placeholder
            if (API_URL.includes("PEGAR_TU_URL")) {
                console.warn("API URL not set. Using mock data.");
                // Mock data for development
                const mockData = [
                    { Fecha: "2023-11-28", Descripción: "Uber", Monto: -5.50, Categoría: "Transporte", Tipo: "Gasto" },
                    { Fecha: "2023-11-28", Descripción: "Sueldo", Monto: 1500.00, Categoría: "Salario", Tipo: "Ingreso" },
                    { Fecha: "2023-11-27", Descripción: "Supermercado", Monto: -45.20, Categoría: "Comida", Tipo: "Gasto" },
                    { Fecha: "2023-11-26", Descripción: "Cine", Monto: -12.00, Categoría: "Entretenimiento", Tipo: "Gasto" },
                ];
                setTimeout(() => {
                    setTransactions(mockData);
                    setLoading(false);
                }, 1000);
                return;
            }

            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Error fetching data');
            const data = await response.json();
            setTransactions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addTransaction = async (transaction) => {
        setLoading(true);
        setError(null);
        try {
            if (API_URL.includes("PEGAR_TU_URL")) {
                // Mock post
                await new Promise(resolve => setTimeout(resolve, 1000));
                const newTransaction = { ...transaction, Fecha: new Date().toISOString().split('T')[0] };
                setTransactions(prev => [newTransaction, ...prev]);
                return { success: true };
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(transaction),
            });

            if (!response.ok) throw new Error('Error saving data');

            // Optimistic update or refetch
            await fetchTransactions();
            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const stats = useMemo(() => {
        const income = transactions
            .filter(t => t.Tipo === 'Ingreso' || t.Monto > 0)
            .reduce((acc, curr) => acc + Number(curr.Monto), 0);

        const expenses = transactions
            .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
            .reduce((acc, curr) => acc + Math.abs(Number(curr.Monto)), 0);

        const balance = income - expenses;

        const expensesByCategory = transactions
            .filter(t => t.Tipo === 'Gasto' || t.Monto < 0)
            .reduce((acc, curr) => {
                const cat = curr.Categoría || 'Otros';
                acc[cat] = (acc[cat] || 0) + Math.abs(Number(curr.Monto));
                return acc;
            }, {});

        const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
            name,
            value,
        }));

        return { income, expenses, balance, chartData };
    }, [transactions]);

    return {
        transactions,
        loading,
        error,
        addTransaction,
        stats,
        refresh: fetchTransactions
    };
}
