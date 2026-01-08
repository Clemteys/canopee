import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';

const App = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [responses, setResponses] = useState([]);
  const [view, setView] = useState('list'); // 'list', 'ask', 'answer', 'results'

  // Simuler le chargement des questions (remplacer par Supabase)
  useEffect(() => {
    const mockQuestions = [
      { id: 1, text: "Les pâtes carbonara doivent contenir de la crème", created_at: new Date() },
      { id: 2, text: "Il faut mettre l'ananas sur la pizza", created_at: new Date() }
    ];
    setQuestions(mockQuestions);
  }, []);

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) return;
    
    const question = {
      id: Date.now(),
      text: newQuestion,
      created_at: new Date()
    };
    
    setQuestions([...questions, question]);
    setNewQuestion('');
    setView('list');
  };

  const handleSubmitResponse = (agreement, importance) => {
    const response = {
      question_id: selectedQuestion.id,
      agreement,
      importance,
      created_at: new Date()
    };
    
    setResponses([...responses, response]);
    setView('results');
  };

  const getQuestionResponses = (questionId) => {
    return responses.filter(r => r.question_id === questionId);
  };

  const AnswerView = () => {
    const [agreement, setAgreement] = useState(50);
    const [importance, setImportance] = useState(50);

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <button 
          onClick={() => setView('list')}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Retour
        </button>
        
        <h2 className="text-2xl font-bold mb-6">{selectedQuestion.text}</h2>
        
        <div className="space-y-8">
          <div>
            <label className="block text-lg font-semibold mb-4">
              Degré d'accord
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm w-24">Pas d'accord</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={agreement}
                onChange={(e) => setAgreement(parseInt(e.target.value))}
                className="flex-1 h-3 bg-gradient-to-r from-red-300 via-gray-300 to-green-300 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm w-24 text-right">D'accord</span>
            </div>
            <div className="text-center mt-2 text-2xl font-bold">
              {agreement}%
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-4">
              Importance pour moi
            </label>
            <div className="flex items-center gap-4">
              <span className="text-sm w-24">Trivial</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={importance}
                onChange={(e) => setImportance(parseInt(e.target.value))}
                className="flex-1 h-3 bg-gradient-to-r from-gray-300 to-purple-400 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm w-24 text-right">Important</span>
            </div>
            <div className="text-center mt-2 text-2xl font-bold">
              {importance}%
            </div>
          </div>

          <button
            onClick={() => handleSubmitResponse(agreement, importance)}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Soumettre ma réponse anonymement
          </button>
        </div>
      </div>
    );
  };

  const ResultsView = () => {
    const questionResponses = getQuestionResponses(selectedQuestion.id);
    
    const scatterData = questionResponses.map((r, i) => ({
      x: r.agreement,
      y: r.importance,
      z: 100
    }));

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <button 
          onClick={() => setView('list')}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Retour aux questions
        </button>
        
        <h2 className="text-2xl font-bold mb-6">{selectedQuestion.text}</h2>
        
        <div className="mb-6">
          <p className="text-gray-600">
            Nombre de réponses : <span className="font-bold">{questionResponses.length}</span>
          </p>
        </div>

        {questionResponses.length > 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Distribution des réponses</h3>
            <ScatterChart width={600} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Accord" 
                domain={[0, 100]}
                label={{ value: 'Pas d\'accord ← → D\'accord', position: 'bottom' }}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Importance" 
                domain={[0, 100]}
                label={{ value: 'Trivial ← → Important', angle: -90, position: 'left' }}
              />
              <ZAxis type="number" dataKey="z" range={[100, 100]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} fill="#3b82f6" />
            </ScatterChart>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Aucune réponse pour l'instant. Soyez le premier à répondre !
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Sondage Anonyme
          </h1>
          <p className="text-gray-600">
            Partagez vos opinions en toute confidentialité
          </p>
        </header>

        {view === 'list' && (
          <div>
            <div className="mb-8 text-center">
              <button
                onClick={() => setView('ask')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                + Poser une nouvelle question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map(q => {
                const qResponses = getQuestionResponses(q.id);
                return (
                  <div key={q.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                    <h3 className="text-xl font-semibold mb-3">{q.text}</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedQuestion(q);
                          setView('answer');
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      >
                        Répondre
                      </button>
                      <button
                        onClick={() => {
                          setSelectedQuestion(q);
                          setView('results');
                        }}
                        className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                      >
                        Voir les résultats ({qResponses.length})
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'ask' && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <button 
              onClick={() => setView('list')}
              className="mb-4 text-blue-600 hover:text-blue-800"
            >
              ← Retour
            </button>
            
            <h2 className="text-2xl font-bold mb-6">Poser une question</h2>
            
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Écrivez votre question ici..."
              className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            
            <button
              onClick={handleSubmitQuestion}
              disabled={!newQuestion.trim()}
              className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Publier la question
            </button>
          </div>
        )}

        {view === 'answer' && <AnswerView />}
        {view === 'results' && <ResultsView />}
      </div>
    </div>
  );
};

export default App;