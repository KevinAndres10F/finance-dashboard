const API_URL = "https://script.google.com/macros/s/AKfycbwvT2nZBMTsFi3do4b1rMzQstVxcQkJQNPZy7NGmdpxDUZG8QaUZmdpwHH6-m_NwROe/exec";

async function testConnection() {
    console.log("Testing POST to:", API_URL);

    const testData = {
        Fecha: "2023-11-28",
        Descripción: "Test desde Node",
        Monto: -10.50,
        Categoría: "Prueba",
        Cuenta: "Principal",
        Tipo: "Gasto"
    };

    const config = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(testData),
    };

    try {
        const response = await fetch(API_URL, config);
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Response text:", text);

        try {
            const json = JSON.parse(text);
            console.log("Response JSON:", json);
        } catch (e) {
            console.log("Response is not JSON");
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testConnection();
