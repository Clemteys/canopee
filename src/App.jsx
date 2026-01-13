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
  const [newQuestionTags, setNewQuestionTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [responses, setResponses] = useState([]);
  const [view, setView] = useState('list');
  const [userId] = useState(getOrCreateUserId());
  const [selectedTags, setSelectedTags] = useState([]);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [sortBy, setSortBy] = useState('date'); // 'date', 'importance', 'controversy'

  useEffect(() => {
    const mockQuestions = [
      { 
        id: 1, 
        text: "Les pâtes carbonara doivent contenir de la crème", 
        tags: ['cuisine', 'italien', 'débat'],
        created_by: 'demo1',
        created_at: new Date() 
      },
      { 
        id: 2, 
        text: "Il faut mettre l'ananas sur la pizza", 
        tags: ['cuisine', 'pizza', 'controverse'],
        created_by: 'demo2',
        created_at: new Date() 
      },
      { 
        id: 3, 
        text: "Le télétravail améliore la productivité", 
        tags: ['travail', 'productivité'],
        created_by: userId,
        created_at: new Date() 
      }
    ];
    setQuestions(mockQuestions);

    const mockResponses = [
      { id: 1, question_id: 1, user_id: 'demo1', agreement: 30, importance: 70 },
      { id: 2, question_id: 1, user_id: 'demo2', agreement: 80, importance: 40 },
      { id: 3, question_id: 2, user_id: 'demo1', agreement: 20, importance: 20 },
    ];
    setResponses(mockResponses);
  }, []);

  // Récupérer tous les tags uniques
  const getAllTags = () => {
    const tagsSet = new Set();
    questions.forEach(q => {
      q.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  };

  // Filtrer les questions par tags sélectionnés
  const getFilteredQuestions = () => {
    if (selectedTags.length === 0) return questions;
    return questions.filter(q => 
      q.tags?.some(tag => selectedTags.includes(tag))
    );
  };

  // Trier les questions
  const getSortedQuestions = (questionsToSort) => {
    const sortedQuestions = [...questionsToSort];
    
    if (sortBy === 'importance') {
      return sortedQuestions.sort((a, b) => {
        const statsA = getQuestionStats(a.id);
        const statsB = getQuestionStats(b.id);
        if (!statsA) return 1;
        if (!statsB) return -1;
        return statsB.avgImportance - statsA.avgImportance;
      });
    } else if (sortBy === 'controversy') {
      return sortedQuestions.sort((a, b) => {
        const statsA = getQuestionStats(a.id);
        const statsB = getQuestionStats(b.id);
        if (!statsA) return 1;
        if (!statsB) return -1;
        return statsB.stdDevGlobal - statsA.stdDevGlobal;
      });
    } else {
      // Tri par date (plus récent d'abord)
      return sortedQuestions.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !newQuestionTags.includes(tag)) {
      setNewQuestionTags([...newQuestionTags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setNewQuestionTags(newQuestionTags.filter(tag => tag !== tagToRemove));
  };

  const toggleTagFilter = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitQuestion = () => {
    if (!newQuestion.trim()) return;
    
    if (editingQuestion) {
      // Modifier une question existante
      const updatedQuestions = questions.map(q => 
        q.id === editingQuestion.id 
          ? { ...q, text: newQuestion, tags: newQuestionTags, updated_at: new Date() }
          : q
      );
      setQuestions(updatedQuestions);
      setEditingQuestion(null);
    } else {
      // Créer une nouvelle question
      const question = {
        id: Date.now(),
        text: newQuestion,
        tags: newQuestionTags,
        created_by: userId,
        created_at: new Date()
      };
      setQuestions([...questions, question]);
    }
    
    setNewQuestion('');
    setNewQuestionTags([]);
    setView('list');
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setNewQuestion(question.text);
    setNewQuestionTags(question.tags || []);
    setView('ask');
  };

  const handleDeleteQuestion = (questionId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      setQuestions(questions.filter(q => q.id !== questionId));
      setResponses(responses.filter(r => r.question_id !== questionId));
    }
  };

  const handleSubmitResponse = (agreement, importance) => {
    const existingResponseIndex = responses.findIndex(
      r => r.question_id === selectedQuestion.id && r.user_id === userId
    );

    if (existingResponseIndex !== -1) {
      const updatedResponses = [...responses];
      updatedResponses[existingResponseIndex] = {
        ...updatedResponses[existingResponseIndex],
        agreement,
        importance,
        updated_at: new Date()
      };
      setResponses(updatedResponses);
    } else {
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

  // Calculer l'écart-type et déterminer si controversé
  const getQuestionStats = (questionId) => {
    const qResponses = getQuestionResponses(questionId);
    if (qResponses.length === 0) return null;

    const avgAgreement = qResponses.reduce((sum, r) => sum + r.agreement, 0) / qResponses.length;
    const avgImportance = qResponses.reduce((sum, r) => sum + r.importance, 0) / qResponses.length;

    // Écart-type pour l'accord
    const varianceAgreement = qResponses.reduce((sum, r) => 
      sum + Math.pow(r.agreement - avgAgreement, 2), 0
    ) / qResponses.length;
    const stdDevAgreement = Math.sqrt(varianceAgreement);

    // Écart-type pour l'importance
    const varianceImportance = qResponses.reduce((sum, r) => 
      sum + Math.pow(r.importance - avgImportance, 2), 0
    ) / qResponses.length;
    const stdDevImportance = Math.sqrt(varianceImportance);

    // Écart-type global (moyenne des deux)
    const stdDevGlobal = (stdDevAgreement + stdDevImportance) / 2;

    // Déterminer le niveau de controverse
    let controversy = 'consensus';
    let controversyLabel = '🤝 Consensus';
    let controversyColor = 'green';
    
    if (stdDevGlobal > 30) {
      controversy = 'very_controversial';
      controversyLabel = '🔥 Très controversé';
      controversyColor = 'red';
    } else if (stdDevGlobal > 20) {
      controversy = 'controversial';
      controversyLabel = '⚡ Controversé';
      controversyColor = 'orange';
    } else if (stdDevGlobal > 10) {
      controversy = 'mixed';
      controversyLabel = '🤔 Avis mitigés';
      controversyColor = 'yellow';
    }

    return {
      avgAgreement,
      avgImportance,
      stdDevAgreement,
      stdDevImportance,
      stdDevGlobal,
      controversy,
      controversyLabel,
      controversyColor
    };
  };

  const TagBadge = ({ tag, onRemove, clickable, active }) => (
    <span 
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
        clickable 
          ? active
            ? 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700'
            : 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200'
          : 'bg-gray-100 text-gray-700'
      } transition`}
      onClick={clickable ? () => toggleTagFilter(tag) : undefined}
    >
      {tag}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          className="ml-1 hover:text-red-600"
        >
          ×
        </button>
      )}
    </span>
  );

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
          <h2 className="text-2xl font-bold mb-3">{selectedQuestion.text}</h2>
          {selectedQuestion.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedQuestion.tags.map(tag => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
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
    const stats = getQuestionStats(selectedQuestion.id);
    
    // Calculer la moyenne des réponses
    const avgAgreement = stats?.avgAgreement || 50;
    const avgImportance = stats?.avgImportance || 50;
    
    // Calculer la distance de l'utilisateur à la moyenne
    const userDistance = userResponse 
      ? Math.sqrt(
          Math.pow(userResponse.agreement - avgAgreement, 2) + 
          Math.pow(userResponse.importance - avgImportance, 2)
        ).toFixed(1)
      : null;
    
    const scatterData = questionResponses.map((r, i) => ({
      x: r.agreement,
      y: r.importance,
      z: 100,
      isUser: r.user_id === userId
    }));

    // Ajouter le point de la moyenne
    const avgPoint = {
      x: avgAgreement,
      y: avgImportance,
      z: 150,
      isAverage: true
    };

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <button 
          onClick={() => setView('list')}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Retour aux questions
        </button>
        
        <h2 className="text-2xl font-bold mb-3">{selectedQuestion.text}</h2>
        
        {selectedQuestion.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedQuestion.tags.map(tag => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}

        {stats && (
          <div className={`mb-4 p-4 rounded-lg bg-${stats.controversyColor}-50 border-l-4 border-${stats.controversyColor}-500`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold text-lg text-${stats.controversyColor}-800`}>
                {stats.controversyLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Écart-type global :</span> {stats.stdDevGlobal.toFixed(1)}
              </div>
              <div>
                <span className="font-semibold">Écart-type accord :</span> {stats.stdDevAgreement.toFixed(1)}
              </div>
              <div>
                <span className="font-semibold">Moyenne accord :</span> {stats.avgAgreement.toFixed(0)}%
              </div>
              <div>
                <span className="font-semibold">Écart-type importance :</span> {stats.stdDevImportance.toFixed(1)}
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <p className="text-gray-600">
              Nombre de réponses : <span className="font-bold">{questionResponses.length}</span>
            </p>
            {userResponse && userDistance && (
              <p className="text-sm text-purple-600 mt-1">
                📏 Distance à la moyenne : <span className="font-bold">{userDistance}</span> points
              </p>
            )}
          </div>
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
              <ZAxis type="number" dataKey="z" range={[100, 150]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} fill="#3b82f6">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isUser ? '#ef4444' : '#3b82f6'} />
                ))}
              </Scatter>
              <Scatter data={[avgPoint]} fill="#a855f7" shape="star" />
            </ScatterChart>
            <div className="mt-4 flex gap-4 justify-center text-sm flex-wrap">
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
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-500" style={{clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'}}>
                </div>
                <span>Moyenne ({avgAgreement.toFixed(0)}%, {avgImportance.toFixed(0)}%)</span>
              </div>
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

  const allTags = getAllTags();
  const filteredQuestions = getSortedQuestions(getFilteredQuestions());

  // Calculer les statistiques globales du groupe
  const getGroupStats = () => {
    const questionsWithResponses = filteredQuestions.filter(q => getQuestionResponses(q.id).length > 0);
    if (questionsWithResponses.length === 0) return null;

    // Moyenne des écarts-types (cohésion du groupe)
    const allStdDevs = questionsWithResponses
      .map(q => getQuestionStats(q.id))
      .filter(s => s !== null)
      .map(s => s.stdDevGlobal);
    
    const avgStdDev = allStdDevs.reduce((sum, std) => sum + std, 0) / allStdDevs.length;

    // Déterminer le niveau de cohésion
    let cohesionLabel = '';
    let cohesionIcon = '';
    let cohesionColor = '';
    let cohesionDescription = '';

    if (avgStdDev < 10) {
      cohesionLabel = 'Très forte';
      cohesionIcon = '💚';
      cohesionColor = 'green';
      cohesionDescription = 'Le groupe partage des opinions très similaires';
    } else if (avgStdDev < 20) {
      cohesionLabel = 'Forte';
      cohesionIcon = '💙';
      cohesionColor = 'blue';
      cohesionDescription = 'Le groupe a globalement des opinions proches';
    } else if (avgStdDev < 30) {
      cohesionLabel = 'Modérée';
      cohesionIcon = '🧡';
      cohesionColor = 'orange';
      cohesionDescription = 'Le groupe présente des différences d\'opinion notables';
    } else {
      cohesionLabel = 'Faible';
      cohesionIcon = '❤️';
      cohesionColor = 'red';
      cohesionDescription = 'Le groupe est très divisé sur de nombreux sujets';
    }

    // Position de l'utilisateur (moyenne des distances)
    const userResponses = questionsWithResponses.filter(q => getUserResponse(q.id));
    let userPositionLabel = '';
    let userPositionIcon = '';
    let userPositionColor = '';
    let userPositionDescription = '';
    let avgDistance = null;

    if (userResponses.length > 0) {
      const allDistances = userResponses.map(q => {
        const response = getUserResponse(q.id);
        const stats = getQuestionStats(q.id);
        if (!response || !stats) return 0;
        return Math.sqrt(
          Math.pow(response.agreement - stats.avgAgreement, 2) + 
          Math.pow(response.importance - stats.avgImportance, 2)
        );
      });

      avgDistance = allDistances.reduce((sum, d) => sum + d, 0) / allDistances.length;

      if (avgDistance < 10) {
        userPositionLabel = 'Mainstream';
        userPositionIcon = '🎯';
        userPositionColor = 'green';
        userPositionDescription = 'Vos opinions sont très alignées avec le groupe';
      } else if (avgDistance < 20) {
        userPositionLabel = 'Conformiste modéré';
        userPositionIcon = '📊';
        userPositionColor = 'blue';
        userPositionDescription = 'Vous partagez globalement les opinions du groupe';
      } else if (avgDistance < 30) {
        userPositionLabel = 'Indépendant';
        userPositionIcon = '🔀';
        userPositionColor = 'purple';
        userPositionDescription = 'Vous avez des opinions distinctes du groupe';
      } else {
        userPositionLabel = 'Atypique';
        userPositionIcon = '🌟';
        userPositionColor = 'pink';
        userPositionDescription = 'Vos opinions sont très différentes de la majorité';
      }
    }

    return {
      avgStdDev,
      cohesionLabel,
      cohesionIcon,
      cohesionColor,
      cohesionDescription,
      userPositionLabel,
      userPositionIcon,
      userPositionColor,
      userPositionDescription,
      avgDistance,
      totalQuestions: questionsWithResponses.length,
      userAnswered: userResponses.length
    };
  };

  const groupStats = getGroupStats();

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
            {/* Statistiques globales du groupe */}
            {groupStats && (
              <div className="mb-8 bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-6 text-center">📊 Statistiques du groupe</h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Cohésion du groupe */}
                  <div className={`p-6 rounded-lg bg-${groupStats.cohesionColor}-50 border-2 border-${groupStats.cohesionColor}-200`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-4xl">{groupStats.cohesionIcon}</span>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">Cohésion du groupe</h3>
                        <p className={`text-lg font-semibold text-${groupStats.cohesionColor}-700`}>
                          {groupStats.cohesionLabel}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 mb-2">{groupStats.cohesionDescription}</p>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-500">Écart-type moyen</span>
                      <span className="text-xl font-bold text-gray-800">{groupStats.avgStdDev.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Position de l'utilisateur */}
                  {groupStats.avgDistance !== null ? (
                    <div className={`p-6 rounded-lg bg-${groupStats.userPositionColor}-50 border-2 border-${groupStats.userPositionColor}-200`}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-4xl">{groupStats.userPositionIcon}</span>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">Votre position</h3>
                          <p className={`text-lg font-semibold text-${groupStats.userPositionColor}-700`}>
                            {groupStats.userPositionLabel}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{groupStats.userPositionDescription}</p>
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-500">Distance moyenne</span>
                        <span className="text-xl font-bold text-gray-800">{groupStats.avgDistance.toFixed(1)}</span>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Répondu à {groupStats.userAnswered}/{groupStats.totalQuestions} questions
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-lg bg-gray-50 border-2 border-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-4xl mb-3 block">🤔</span>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Aucune réponse</h3>
                        <p className="text-gray-600">
                          Répondez à quelques questions pour voir votre position dans le groupe
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Filtre par tags */}
            {allTags.length > 0 && (
              <div className="mb-6 bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Filtrer par tags</h3>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <TagBadge 
                      key={tag} 
                      tag={tag} 
                      clickable 
                      active={selectedTags.includes(tag)}
                    />
                  ))}
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="mt-3 text-sm text-gray-600 hover:text-gray-800"
                  >
                    ✕ Effacer les filtres
                  </button>
                )}
              </div>
            )}

            {/* Tri des questions */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Trier par :</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSortBy('date')}
                    className={`px-4 py-2 rounded-lg transition ${
                      sortBy === 'date'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📅 Date
                  </button>
                  <button
                    onClick={() => setSortBy('importance')}
                    className={`px-4 py-2 rounded-lg transition ${
                      sortBy === 'importance'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ⭐ Importance
                  </button>
                  <button
                    onClick={() => setSortBy('controversy')}
                    className={`px-4 py-2 rounded-lg transition ${
                      sortBy === 'controversy'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    🔥 Controverse
                  </button>
                </div>
              </div>
            </div>

            <div className="mb-8 text-center">
              <button
                onClick={() => setView('ask')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                + Poser une nouvelle question
              </button>
            </div>

            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
                Aucune question ne correspond à ces tags
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map(q => {
                  const qResponses = getQuestionResponses(q.id);
                  const userResponse = getUserResponse(q.id);
                  const isCreator = q.created_by === userId;
                  const stats = getQuestionStats(q.id);
                  
                  // Calculer la distance de l'utilisateur à la moyenne
                  let userDistance = null;
                  let distanceLabel = '';
                  let distanceColor = '';
                  
                  if (userResponse && stats) {
                    const distance = Math.sqrt(
                      Math.pow(userResponse.agreement - stats.avgAgreement, 2) + 
                      Math.pow(userResponse.importance - stats.avgImportance, 2)
                    );
                    userDistance = distance.toFixed(1);
                    
                    if (distance < 10) {
                      distanceLabel = '🎯 Aligné avec la moyenne';
                      distanceColor = 'green';
                    } else if (distance < 25) {
                      distanceLabel = '📊 Position modérée';
                      distanceColor = 'blue';
                    } else if (distance < 40) {
                      distanceLabel = '🔀 Position différente';
                      distanceColor = 'orange';
                    } else {
                      distanceLabel = '🌟 Position très minoritaire';
                      distanceColor = 'purple';
                    }
                  }
                  
                  return (
                    <div key={q.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-semibold flex-1">{q.text}</h3>
                        <div className="flex gap-2 ml-2">
                          {userResponse && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              ✓ Répondu
                            </span>
                          )}
                          {isCreator && (
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                              👤 Votre question
                            </span>
                          )}
                        </div>
                      </div>
                      {q.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {q.tags.map(tag => (
                            <TagBadge key={tag} tag={tag} />
                          ))}
                        </div>
                      )}
                      <div className="space-y-2 mb-3">
                        {stats && (
                          <div className={`p-3 rounded-lg bg-${stats.controversyColor}-50 border-l-4 border-${stats.controversyColor}-500`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold text-${stats.controversyColor}-800`}>
                                {stats.controversyLabel}
                              </span>
                              <span className="text-sm text-gray-600">
                                σ = {stats.stdDevGlobal.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        )}
                        {userDistance && (
                          <div className={`p-3 rounded-lg bg-${distanceColor}-50 border-l-4 border-${distanceColor}-500`}>
                            <div className="flex items-center justify-between">
                              <span className={`font-semibold text-${distanceColor}-800`}>
                                {distanceLabel}
                              </span>
                              <span className="text-sm text-gray-600">
                                d = {userDistance}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-3 flex-wrap">
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
                        {isCreator && (
                          <>
                            <button
                              onClick={() => handleEditQuestion(q)}
                              className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
                            >
                              ✏️ Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                            >
                              🗑️ Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === 'ask' && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <button 
              onClick={() => {
                setView('list');
                setEditingQuestion(null);
                setNewQuestion('');
                setNewQuestionTags([]);
              }}
              className="mb-4 text-blue-600 hover:text-blue-800"
            >
              ← Retour
            </button>
            
            <h2 className="text-2xl font-bold mb-6">
              {editingQuestion ? 'Modifier la question' : 'Poser une question'}
            </h2>
            
            <textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Écrivez votre question ici..."
              className="w-full h-32 p-4 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none mb-4"
            />
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Tags (optionnel)</label>
              
              {/* Tags existants à sélectionner */}
              {allTags.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-600 mb-2">Tags existants :</p>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          if (!newQuestionTags.includes(tag)) {
                            setNewQuestionTags([...newQuestionTags, tag]);
                          } else {
                            handleRemoveTag(tag);
                          }
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                          newQuestionTags.includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {newQuestionTags.includes(tag) ? '✓ ' : ''}{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Créer un nouveau tag */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Ou créer un nouveau tag..."
                  className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  + Créer
                </button>
              </div>
              
              {/* Tags sélectionnés */}
              {newQuestionTags.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">Tags de cette question :</p>
                  <div className="flex flex-wrap gap-2">
                    {newQuestionTags.map(tag => (
                      <TagBadge 
                        key={tag} 
                        tag={tag} 
                        onRemove={handleRemoveTag}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleSubmitQuestion}
              disabled={!newQuestion.trim()}
              className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {editingQuestion ? '✓ Mettre à jour la question' : 'Publier la question'}
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