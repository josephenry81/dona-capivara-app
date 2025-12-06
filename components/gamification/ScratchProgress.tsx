import React from 'react';

interface ScratchProgressProps {
    user: {
        points: number;
        streak: number;
        referralCount: number;
        scratchesAvailable: number;
    };
    nextMilestone: {
        points: number;
        remaining: number;
        reward: string;
    };
}

export default function ScratchProgress({ user, nextMilestone }: ScratchProgressProps) {
    const calculateProgress = (current: number, target: number) => {
        return Math.min((current / target) * 100, 100);
    };

    const milestones = [
        { points: 100, reward: '1 raspadinha', icon: '⭐' },
        { points: 250, reward: '2 raspadinhas', icon: '💫' },
        { points: 500, reward: 'Capivara Gold', icon: '👑' },
        { points: 1000, reward: 'Lendário', icon: '🏆' }
    ];

    const getCurrentMilestone = () => {
        return milestones.filter(m => user.points < m.points)[0] || milestones[milestones.length - 1];
    };

    const currentMilestone = getCurrentMilestone();
    const progress = calculateProgress(user.points, currentMilestone.points);

    return (
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">
                    🎴 Progresso de Raspadinhas
                </h3>
                {user.scratchesAvailable > 0 && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                        {user.scratchesAvailable} disponível{user.scratchesAvailable > 1 ? 'is' : ''}
                    </div>
                )}
            </div>

            {/* Progress Bar Principal */}
            <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>{user.points} pontos</span>
                    <span>{currentMilestone.points} pontos</span>
                </div>
                <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 transition-all duration-1000 flex items-center justify-end pr-2"
                        style={{ width: `${progress}%` }}
                    >
                        {progress > 20 && (
                            <span className="text-white text-xs font-bold">
                                {Math.round(progress)}%
                            </span>
                        )}
                    </div>
                </div>
                <p className="text-xs text-center text-gray-500 mt-2">
                    Faltam {currentMilestone.points - user.points} pontos para: {currentMilestone.reward}
                </p>
            </div>

            {/* Milestones Grid */}
            <div className="grid grid-cols-4 gap-2">
                {milestones.map((milestone) => {
                    const isUnlocked = user.points >= milestone.points;
                    const isCurrent = currentMilestone.points === milestone.points;

                    return (
                        <div
                            key={milestone.points}
                            className={`text-center p-3 rounded-xl border-2 transition ${isUnlocked
                                    ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
                                    : isCurrent
                                        ? 'bg-yellow-50 border-yellow-300 animate-pulse'
                                        : 'bg-gray-50 border-gray-200'
                                }`}
                        >
                            <div className={`text-3xl mb-1 ${isUnlocked ? 'animate-bounce' : 'grayscale'}`}>
                                {milestone.icon}
                            </div>
                            <p className="text-xs font-bold text-gray-700">
                                {milestone.points}
                            </p>
                            <p className="text-xs text-gray-500 line-clamp-2">
                                {milestone.reward}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
                {/* Streak */}
                <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">🔥</div>
                    <p className="text-lg font-bold text-orange-700">{user.streak}</p>
                    <p className="text-xs text-orange-600">Dias seguidos</p>
                </div>

                {/* Referrals */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">🤝</div>
                    <p className="text-lg font-bold text-blue-700">{user.referralCount}</p>
                    <p className="text-xs text-blue-600">Indicações</p>
                </div>

                {/* Pontos */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">💎</div>
                    <p className="text-lg font-bold text-purple-700">{user.points}</p>
                    <p className="text-xs text-purple-600">Pontos</p>
                </div>
            </div>

            {/* Dicas de Desbloqueio */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-xl p-4">
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span>💡</span>
                    <span>Como ganhar raspadinhas:</span>
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Compre acima de R$ 30 (1 raspadinha)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Compre 3 dias seguidos (streak)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Indique amigos (1 por indicação)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-yellow-500">⭐</span>
                        <span>Alcance marcos de pontos (100, 250, 500)</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-purple-500">👑</span>
                        <span>Troque 200 pontos por 1 raspadinha</span>
                    </li>
                </ul>
            </div>

            {/* Botão de Compra com Pontos */}
            {user.points >= 200 && (
                <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-xl hover:shadow-lg transition">
                    💰 Comprar Raspadinha (200 pontos)
                </button>
            )}
        </div>
    );
}
