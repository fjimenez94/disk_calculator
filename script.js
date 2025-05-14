document.addEventListener('DOMContentLoaded', () => {
    const calcularBtn = document.getElementById('calcularBtn');
    if (calcularBtn) {
        calcularBtn.addEventListener('click', calcularCarga);
    }
    // calcularCarga(); // Descomentar para una carga inicial con valores por defecto
});

const coloresDiscos = {
    55: 'disco-55',
    45: 'disco-45',
    35: 'disco-35',
    25: 'disco-25',
    15: 'disco-15',
    10: 'disco-10',
    5: 'disco-5',
    2.5: 'disco-2_5'
};

function calcularCarga() {
    const pesoMaximoInput = document.getElementById('pesoMaximo');
    const porcentajeInput = document.getElementById('porcentaje');
    const tipoBarraSelect = document.getElementById('tipoBarra');
    const ladoIzquierdoDiv = document.getElementById('ladoIzquierdo');
    const ladoDerechoDiv = document.getElementById('ladoDerecho');
    const pesoObjetivoDisplay = document.getElementById('peso-objetivo-display');
    const pesoTotalCargadoDisplay = document.getElementById('peso-total-cargado');

    const pesoMaximo = parseFloat(pesoMaximoInput.value);
    const porcentaje = parseFloat(porcentajeInput.value);
    const pesoBarra = parseInt(tipoBarraSelect.value);

    const checkboxes = document.querySelectorAll('input[name="discos"]:checked');
    let discosDisponibles = [];
    checkboxes.forEach(checkbox => {
        discosDisponibles.push(parseFloat(checkbox.value));
    });

    if (isNaN(pesoMaximo) || isNaN(porcentaje) || pesoMaximo <= 0 || porcentaje <= 0 || porcentaje > 100) {
        alert("Por favor, ingresa valores válidos para peso máximo y porcentaje.");
        ladoIzquierdoDiv.innerHTML = '';
        ladoDerechoDiv.innerHTML = '';
        pesoObjetivoDisplay.textContent = '';
        pesoTotalCargadoDisplay.textContent = '';
        return;
    }

    const pesoObjetivoTotal = pesoMaximo * (porcentaje / 100);
    pesoObjetivoDisplay.textContent = `Peso Objetivo: ${pesoObjetivoTotal.toFixed(2)} lbs`;

    let pesoDiscosNecesario = pesoObjetivoTotal - pesoBarra;

    if (pesoDiscosNecesario < 0) {
        pesoDiscosNecesario = 0;
    }

    if (pesoDiscosNecesario < 0.001 && pesoDiscosNecesario >= 0) { // Tolerancia muy pequeña
        ladoIzquierdoDiv.innerHTML = '';
        ladoDerechoDiv.innerHTML = '';
        if (pesoObjetivoTotal < pesoBarra && pesoBarra > 0) {
            pesoTotalCargadoDisplay.textContent = `Peso Total en Barra: ${pesoBarra.toFixed(2)} lbs (Solo la barra. El objetivo es menor que el peso de la barra).`;
        } else {
            pesoTotalCargadoDisplay.textContent = `Peso Total en Barra: ${pesoBarra.toFixed(2)} lbs (Solo la barra).`;
        }
        return;
    }
    
    if (discosDisponibles.length === 0 && pesoDiscosNecesario > 0) {
        ladoIzquierdoDiv.innerHTML = '';
        ladoDerechoDiv.innerHTML = '';
        pesoTotalCargadoDisplay.textContent = `Peso Total en Barra: ${pesoBarra.toFixed(2)} lbs (Solo la barra, no hay discos seleccionados para alcanzar el objetivo).`;
        return;
    }
     if (discosDisponibles.length === 0 && pesoDiscosNecesario === 0) {
        ladoIzquierdoDiv.innerHTML = '';
        ladoDerechoDiv.innerHTML = '';
        pesoTotalCargadoDisplay.textContent = `Peso Total en Barra: ${pesoBarra.toFixed(2)} lbs (Solo la barra).`;
        return;
    }


    const discosOrdenadosDesc = [...discosDisponibles].sort((a, b) => b - a);
    const discosOrdenadosAsc = [...discosDisponibles].sort((a, b) => a - b);

    // --- Calcular carga por debajo (o igual) ---
    let carga_por_debajo_peso_total_discos = 0;
    let pesoRestante_debajo = pesoDiscosNecesario;

    for (const pesoDisco of discosOrdenadosDesc) {
        const pesoParDisco = pesoDisco * 2;
        if (pesoDisco > 0 && pesoRestante_debajo >= pesoParDisco - 0.001) { // Tolerancia
            const cantidadPares = Math.floor(pesoRestante_debajo / pesoParDisco);
            for (let i = 0; i < cantidadPares; i++) {
                carga_por_debajo_peso_total_discos += pesoParDisco;
                pesoRestante_debajo -= pesoParDisco;
            }
        }
    }

    // --- Calcular carga por arriba (la más cercana que iguala o supera) ---
    let carga_por_arriba_peso_total_discos = 0;
    let tempPesoBaseParaArriba = carga_por_debajo_peso_total_discos;

    if (tempPesoBaseParaArriba < pesoDiscosNecesario - 0.001) { // Tolerancia
        let mejorOpcionParaSuperar = null; 

        for (const discoAdd of discosOrdenadosAsc) {
            const parAdd = discoAdd * 2;
            let nuevoPesoTotalDiscosConAdicion = tempPesoBaseParaArriba + parAdd;

            if (nuevoPesoTotalDiscosConAdicion >= pesoDiscosNecesario - 0.001) { // Tolerancia
                if (mejorOpcionParaSuperar === null || nuevoPesoTotalDiscosConAdicion < mejorOpcionParaSuperar.peso) {
                    mejorOpcionParaSuperar = {
                        peso: nuevoPesoTotalDiscosConAdicion 
                    };
                } else if (nuevoPesoTotalDiscosConAdicion === mejorOpcionParaSuperar.peso) {
                    // Se prefiere la que usa el disco más pequeño si el peso total es el mismo
                }
            }
        }
        
        if (mejorOpcionParaSuperar !== null) {
            carga_por_arriba_peso_total_discos = mejorOpcionParaSuperar.peso;
        } else {
            carga_por_arriba_peso_total_discos = tempPesoBaseParaArriba; 
        }
    } else { 
        carga_por_arriba_peso_total_discos = tempPesoBaseParaArriba; 
    }

    // --- Decidir cuál peso total de discos usar ---
    const diff_debajo = Math.abs(pesoDiscosNecesario - carga_por_debajo_peso_total_discos);
    const diff_arriba = (carga_por_arriba_peso_total_discos > 0 || pesoDiscosNecesario === 0) ? 
                      Math.abs(pesoDiscosNecesario - carga_por_arriba_peso_total_discos) : Infinity;

    let pesoTotalDiscosObjetivoFinal;

    if (diff_debajo <= diff_arriba + 0.001) { // Tolerancia al comparar diferencias
        pesoTotalDiscosObjetivoFinal = carga_por_debajo_peso_total_discos;
    } else {
        pesoTotalDiscosObjetivoFinal = carga_por_arriba_peso_total_discos;
    }
    
    // --- Recalcular la composición óptima de discos para el pesoTotalDiscosObjetivoFinal ---
    let discosFinalesParaCadaLado = [];
    let pesoRestanteParaComposicion = pesoTotalDiscosObjetivoFinal;

    for (const pesoDisco of discosOrdenadosDesc) {
        const pesoParDisco = pesoDisco * 2;
        if (pesoDisco > 0 && pesoRestanteParaComposicion >= pesoParDisco - 0.001) { 
            // Cuántos pares de este disco podemos agregar
            // Math.floor puede ser problemático con flotantes, ej. 4.9999 / 5 = 0.
            // Una forma más segura para flotantes es restar hasta que no se pueda.
            while(pesoRestanteParaComposicion >= pesoParDisco - 0.001 && pesoParDisco > 0){
                 discosFinalesParaCadaLado.push(pesoDisco); 
                 pesoRestanteParaComposicion -= pesoParDisco;
            }
        }
    }
    discosFinalesParaCadaLado.sort((a, b) => b - a);

    // Descomentar para depuración en la consola del navegador
    // console.log("Discos Disponibles:", discosDisponibles);
    // console.log("Peso Discos Necesario:", pesoDiscosNecesario.toFixed(2));
    // console.log("Carga Por Debajo (total discos):", carga_por_debajo_peso_total_discos.toFixed(2), "Diff:", diff_debajo.toFixed(2));
    // console.log("Carga Por Arriba (total discos):", carga_por_arriba_peso_total_discos.toFixed(2), "Diff:", diff_arriba.toFixed(2));
    // console.log("Peso Total Discos Objetivo Final:", pesoTotalDiscosObjetivoFinal.toFixed(2));
    // console.log("Composición Final Discos Lado:", discosFinalesParaCadaLado);

    mostrarDiscos(discosFinalesParaCadaLado, pesoBarra, pesoTotalDiscosObjetivoFinal, ladoIzquierdoDiv, ladoDerechoDiv, pesoTotalCargadoDisplay);
}

function mostrarDiscos(discosEnUnLado, pesoBarra, pesoTotalDeDiscosCalculado, ladoIzquierdoDiv, ladoDerechoDiv, pesoTotalCargadoDisplay) {
    ladoIzquierdoDiv.innerHTML = '';
    ladoDerechoDiv.innerHTML = '';

    discosEnUnLado.forEach(peso => {
        const claseColor = coloresDiscos[peso.toString()] || 'disco-default'; // Usar toString para claves de objeto

        const discoDivIzq = document.createElement('div');
        discoDivIzq.classList.add('disco', claseColor);
        discoDivIzq.textContent = peso % 1 === 0 ? peso : peso.toFixed(1);
        ladoIzquierdoDiv.appendChild(discoDivIzq);

        const discoDivDer = document.createElement('div');
        discoDivDer.classList.add('disco', claseColor);
        discoDivDer.textContent = peso % 1 === 0 ? peso : peso.toFixed(1);
        ladoDerechoDiv.appendChild(discoDivDer);
    });
    
    const pesoTotalEnBarra = pesoBarra + pesoTotalDeDiscosCalculado;
    pesoTotalCargadoDisplay.textContent = `Peso Total en Barra: ${pesoTotalEnBarra.toFixed(2)} lbs`;
}