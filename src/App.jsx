import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';

// Génération d'un identifiant anonyme unique par navigateur
const getOrCreateUserId = () => {
  let userId = localStorage.getItem('anonymous_user_id');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    localStorage.setItem('anonymous_user_id', userId);
  }
  return userId;
};

const App = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [responses, setResponses] = useState([]);
  const [view, setView] = useState('list');
  const [userId] = useState(getOrCreateUserId());

  useEffect(() => {
    const mockQuestions = [
      { id: 1, text: "Les pâtes carbonara doivent contenir de la crème", created_at: new Date() },
      { id: 2, text: "Il faut mettre l'ananas sur la pizza", created_at: new Date() }
    ];
    setQuestions(mockQuestions);

    // Mock responses pour la démo
    const mockResponses = [
      { id: 1, question_id: 1, user_id: 'demo1', agreement: 30, importance: 70 },
      { id: 2, question_id: 1, user_id: 'demo2', agreement: 80, importance: 40 },
      { id: 3, question_id: 2, user_id: 'demo1', agreement: 20, importance: 20 },
    ];
    setResponses(mockResponses);
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
    // Vérifier si l'utilisateur a déjà répondu
    const existingResponseIndex = responses.findIndex(
      r => r.question_id === selectedQuestion.id && r.user_id === userId
    );

    if (existingResponseIndex !== -1) {
      // Modifier la réponse existante
      const updatedResponses = [...responses];
      updatedResponses[existingResponseIndex] = {
        ...updatedResponses[existingResponseIndex],
        agreement,
        importance,
        updated_at: new Date()
      };
      setResponses(updatedResponses);
    } else {
      // Créer une nouvelle réponse
      const response = {
        id: Date.now(),
        question_id: selectedQuestion.id,
        user_id: userId,
        agreement,
        importance,
        created_at: new Date()
      };
      setResponses([...responses, response]);
    }
    
    setView('results');
  };

  const getQuestionResponses = (questionId) => {
    return responses.filter(r => r.question_id === questionId);
  };

  const getUserResponse = (questionId) => {
    return responses.find(r => r.question_id === questionId && r.user_id === userId);
  };

  const AnswerView = () => {
    const existingResponse = getUserResponse(selectedQuestion.id);
    const [agreement, setAgreement] = useState(existingResponse?.agreement || 50);
    const [importance, setImportance] = useState(existingResponse?.importance || 50);
    const isEditing = !!existingResponse;

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <button 
          onClick={() => setView('list')}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Retour
        </button>
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{selectedQuestion.text}</h2>
          {isEditing && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="text-blue-800 font-semibold">
                ✏️ Modification de votre réponse
              </p>
              <p className="text-blue-600 text-sm mt-1">
                Vous pouvez changer d'avis autant de fois que vous voulez
              </p>
            </div>
          )}
        </div>
        
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
            {isEditing ? '✏️ Mettre à jour ma réponse' : '✓ Soumettre ma réponse'}
          </button>
        </div>
      </div>
    );
  };

  const ResultsView = () => {
    const questionResponses = getQuestionResponses(selectedQuestion.id);
    const userResponse = getUserResponse(selectedQuestion.id);
    
    const scatterData = questionResponses.map((r, i) => ({
      x: r.agreement,
      y: r.importance,
      z: 100,
      isUser: r.user_id === userId
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
        
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Nombre de réponses : <span className="font-bold">{questionResponses.length}</span>
          </p>
          {userResponse && (
            <button
              onClick={() => setView('answer')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition text-sm"
            >
              ✏️ Modifier ma réponse
            </button>
          )}
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
              <Scatter data={scatterData} fill="#3b82f6">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isUser ? '#ef4444' : '#3b82f6'} />
                ))}
              </Scatter>
            </ScatterChart>
            <div className="mt-4 flex gap-4 justify-center text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>Autres réponses</span>
              </div>
              {userResponse && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span>Votre réponse</span>
                </div>
              )}
            </div>
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
          <p className="text-xs text-gray-500 mt-2">
            🔒 Votre ID anonyme : {userId.substring(0, 12)}...
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
                const userResponse = getUserResponse(q.id);
                return (
                  <div key={q.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold flex-1">{q.text}</h3>
                      {userResponse && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded ml-2">
                          ✓ Répondu
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedQuestion(q);
                          setView('answer');
                        }}
                        className={`${
                          userResponse 
                            ? 'bg-orange-600 hover:bg-orange-700' 
                            : 'bg-blue-600 hover:bg-blue-700'
                        } text-white px-4 py-2 rounded transition`}
                      >
                        {userResponse ? '✏️ Modifier ma réponse' : 'Répondre'}
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