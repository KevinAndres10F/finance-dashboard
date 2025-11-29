import { useState, useEffect, useMemo } from 'react';

const API_URL = "https://script.google.com/macros/s/AKfycbxV8mm0e1YaBtdbMCRDeTljhrZ7Z16lAxTHSjCnAXUiPmo5MpKTCn8ZX23iYsxhr9JV/exec";

export function useFinanzas() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTransactions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Error fetching data');
            const data = await response.json();
            console.log("Datos recibidos:", data);
            setTransactions(data);
        } catch (err) {
            console.error("Error cargando datos:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const addTransaction = async (transaction) => {
        setLoading(true);
        setError(null);

        // Truco para Google Apps Script: Enviar como texto plano para evitar error de CORS
        const config = {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(transaction),
        };

        try {
            await fetch(API_URL, config);

            // Actualización optimista
            setTransactions(prev => [...prev, transaction]);
            return { success: true };
        } catch (err) {
            console.error("Error guardando:", err);
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
