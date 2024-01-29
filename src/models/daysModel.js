const pool = require('./connection'); 

const getDays = async (date) => {
    const proceduresQuery = 'SELECT * FROM procedures';
    const dailysQuery = 'SELECT * FROM dailys WHERE "date_register" = $1';
    
    const proceduresResult = await pool.query(proceduresQuery);
    const dailysResult = await pool.query(dailysQuery, [date.date]);

    const procedures = proceduresResult.rows;
    const rows = dailysResult.rows;

    let arrayDays = rows.map(row => ({ ...row }));
    arrayDays.forEach(novoId => {
        procedures.forEach(item => {
            if (item.idProcedure === novoId.idProcedure) {
                novoId.nameProcedure = item.nameProcedure;
                novoId.typeProcedure = item.typeProcedure;
            }
        });
    });

    return arrayDays;
};

const getDaysNotPay = async () => {
    const query = 'SELECT * FROM dailys WHERE pago = $1';
    const result = await pool.query(query, [false]);

    let arrayDays = result.rows;
    let daysNotpay = null;

    try {
        daysNotpay = arrayDays.reduce((accumulator, registro) => {
            const date = new Date(registro.dateRegister).toLocaleDateString();
            const key = `${date}_${registro.pago}`;

            if (!accumulator[key]) {
                accumulator[key] = {
                    ids: [registro.idRegister],
                    date: date,
                    total: parseFloat(registro.price.toFixed(2)),
                    status: registro.pago === '1' ? 'Pago' : 'Não Pago',
                };
            } else {
                if (!accumulator[key].ids) {
                    accumulator[key].ids = [];
                }
                const precoArredondado = parseFloat(registro.price.toFixed(2));
                accumulator[key].total += precoArredondado;
                accumulator[key].ids.push(registro.idRegister);
            }
            return accumulator;
        }, {});

        daysNotpay = Object.values(daysNotpay).map(obj => ({ ...obj }));
        return daysNotpay;
    } catch (error) {
        console.error("Erro ao obter dias não pagos:", error.message);
        throw error;
    }
};

const createAtendiment = async ({ name, idProcedure, price }) => {
    try {
        const date = new Date();
        const values = [name, idProcedure, date, false, null, price];
        const sql = `INSERT INTO dailys ("name_client", "id_procedure", "date_register", "pago", "id_pagamento", "price") VALUES ($1, $2, $3, $4, $5, $6)`;

        const result = await pool.query(sql, values);
        return result.rows[0];
    } catch (error) {
        console.error("Erro ao criar atendimento:", error.message);
        throw error;
    }
};

const deleteAtendiment = async (id) => {
    const query = 'DELETE FROM dailys WHERE "id_register" = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

module.exports = {
    getDays,
    getDaysNotPay,
    createAtendiment,
    deleteAtendiment,
};
