new Vue({
    el: '#app',
    data: {
        integrantes: [],
        avaliacoes: [],
        selectedWeek: 1,
        selectedAvaliador: '',
        currentNota: '',
        loading: false,
        SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwoDtigcyh7pYT1XUzCuFLm3hNVS1Rek3SJ1-HnjluRiD73seUOguD3hJgzIeoT0yoeyQ/exec'
    computed: {
        proximoAvaliado() {
            if (!this.selectedAvaliador) return null;
            const avaliador = this.integrantes.find(i => i.nome === this.selectedAvaliador);
            const isEnergyWeek = this.selectedWeek % 2 === 1;
            
            const possiveis = this.integrantes.filter(pessoa => {
                if (pessoa.nome === this.selectedAvaliador) return false;
                
                if (avaliador.curso === "Energia") {
                    return (pessoa.curso === "Energia" || (pessoa.curso === "TEC" && isEnergyWeek));
                } else if (avaliador.curso === "Automação") {
                    return (pessoa.curso === "Automação" || (pessoa.curso === "TEC" && !isEnergyWeek));
                } else if (avaliador.curso === "TEC") {
                    return isEnergyWeek ? pessoa.curso === "Energia" : pessoa.curso === "Automação";
                }
                return false;
            });

            const jaAvaliados = this.avaliacoes
                .filter(a => a.avaliador === this.selectedAvaliador && a.semana === this.selectedWeek)
                .map(a => a.avaliado);

            return possiveis.find(p => !jaAvaliados.includes(p.nome));
        }
    },
    methods: {
        async loadData() {
            this.loading = true;
            try {
                const response = await axios.get(this.SCRIPT_URL);
                this.integrantes = response.data.data.integrantes.slice(1);
                this.avaliacoes = response.data.data.avaliacoes.slice(1);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            }
            this.loading = false;
        },
        async submitAvaliacao() {
            if (!this.selectedAvaliador || !this.currentNota || !this.proximoAvaliado) return;
            
            const nota = parseFloat(this.currentNota);
            if (isNaN(nota) || nota < 0 || nota > 20) {
                alert('Por favor, insira uma nota válida entre 0 e 20');
                return;
            }

            try {
                await axios.post(this.SCRIPT_URL, {
                    semana: this.selectedWeek,
                    avaliador: this.selectedAvaliador,
                    avaliado: this.proximoAvaliado.nome,
                    nota: nota
                });
                
                this.currentNota = '';
                await this.loadData();
            } catch (error) {
                console.error('Erro ao submeter avaliação:', error);
                alert('Erro ao salvar avaliação. Tente novamente.');
            }
        },
        calcularMedia(nome) {
            const notas = this.avaliacoes
                .filter(a => a.avaliado === nome)
                .map(a => parseFloat(a.nota));
            
            if (notas.length === 0) return '-';
            return (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(2);
        }
    },
    mounted() {
        this.loadData();
    },
    template: `
        <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
            <h1 class="text-2xl font-bold mb-6">Sistema de Avaliação Cíclica</h1>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <label class="block text-sm font-medium mb-2">Semana</label>
                    <select v-model="selectedWeek" class="w-full p-2 border rounded">
                        <option v-for="n in 15" :key="n" :value="n">Semana {{n}}</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Avaliador</label>
                    <select v-model="selectedAvaliador" class="w-full p-2 border rounded">
                        <option value="">Selecione o avaliador</option>
                        <option v-for="pessoa in integrantes" :key="pessoa.numero" :value="pessoa.nome">
                            {{pessoa.nome}} ({{pessoa.curso}})
                        </option>
                    </select>
                </div>
            </div>

            <div v-if="selectedAvaliador && proximoAvaliado" class="mb-6">
                <div class="bg-gray-50 p-4 rounded mb-4">
                    <h3 class="font-medium">Próxima Pessoa a Avaliar:</h3>
                    <p class="text-lg">{{proximoAvaliado.nome}}</p>
                </div>

                <div class="flex gap-4">
                    <input
                        type="number"
                        v-model="currentNota"
                        class="flex-1 p-2 border rounded"
                        placeholder="Nota (0-20)"
                        min="0"
                        max="20"
                        step="0.1"
                    >
                    <button
                        @click="submitAvaliacao"
                        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Registrar Avaliação
                    </button>
                </div>
            </div>

            <div class="mt-8">
                <h3 class="font-medium mb-4">Médias das Avaliações:</h3>
                <div class="grid grid-cols-2 gap-4">
                    <div v-for="pessoa in integrantes" :key="pessoa.numero" class="p-2 bg-gray-50 rounded">
                        <span class="font-medium">{{pessoa.nome}}:</span>
                        {{calcularMedia(pessoa.nome)}}
                    </div>
                </div>
            </div>
        </div>
    `
});
