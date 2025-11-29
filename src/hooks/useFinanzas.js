import { useState, useEffect, useMemo } from 'react';

const API_URL = "https://script.google.com/macros/s/AKfycbwvT2nZBMTsFi3do4b1rMzQstVxcQkJQNPZy7NGmdpxDUZG8QaUZmdpwHH6-m_NwROe/exec";

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

            const text = await response.text();
            try {
                const rawData = JSON.parse(text);
                console.log("Datos crudos recibidos:", rawData);

                // Normalizar datos para asegurar compatibilidad con el frontend
                // El script devuelve lo que hay en las cabeceras de la hoja.
                // Mapeamos posibles variaciones a las claves que usa la app
                const normalizedData = rawData.map(item => ({
                    ...item,
                    Categoría: item.Categoría || item.Categoria || 'Otros',
                    Descripción: item.Descripción || item.Descripcion || item.Descripcion || '',
                    Monto: Number(item.Monto) || 0,
                    Tipo: item.Tipo || 'Gasto',
                    Fecha: item.Fecha || '',
                    Cuenta: item.Cuenta || 'Principal'
                }));

                setTransactions(normalizedData);
            } catch (e) {
                console.error("Error parseando JSON:", e);
                console.log("Respuesta recibida (no es JSON):", text);
                throw new Error("La respuesta del servidor no es un JSON válido. Revisa la consola.");
            }
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

        // Payload adaptado EXACTAMENTE a tu script de Google Apps Script
        // Tu script espera: datos.monto, datos.tipo, datos.descripcion, datos.comercio, datos.categoria, datos.cuenta
        const payload = {
            monto: transaction.Monto,
            tipo: transaction.Tipo,
            descripcion: transaction.Descripción,
            comercio: transaction.Descripción, // Usamos la descripción como comercio
            categoria: transaction.Categoría,
            cuenta: transaction.Cuenta
        };

        // Truco para Google Apps Script: Enviar como texto plano para evitar error de CORS
        const config = {
            method: 'POST',
            // mode: 'no-cors', // ELIMINADO: Usamos text/plain para evitar preflight, pero permitimos leer respuesta
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(payload),
        };

        try {
            await fetch(API_URL, config);

            // En modo no-cors, no podemos ver la respuesta, así que asumimos éxito si no hay error de red
            // Actualización optimista
            const newTransaction = {
                ...transaction,
                Fecha: new Date().toISOString().split('T')[0] // La fecha la pone el script, pero la simulamos para la UI
            };
            setTransactions(prev => [...prev, newTransaction]);
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

    // Extraer categorías únicas de las transacciones + las por defecto
    const categories = useMemo(() => {
        const defaultCategories = ['Comida', 'Transporte', 'Entretenimiento', 'Salud', 'Servicios', 'Salario', 'Otros'];
        const transactionCategories = transactions.map(t => t.Categoría).filter(Boolean);
        // Unir y quitar duplicados
        return [...new Set([...defaultCategories, ...transactionCategories])].sort();
    }, [transactions]);

    return {
        transactions,
        loading,
        error,
        addTransaction,
        stats,
        categories, // Exportamos las categorías dinámicas
        refresh: fetchTransactions
    };
}
