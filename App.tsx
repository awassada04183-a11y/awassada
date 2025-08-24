
import React, { useState, useCallback, useMemo } from 'react';
import { QUIZ_QUESTIONS } from './constants';
import type { Question, Option } from './types';
import { analyzePersonality } from './services/geminiService';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <svg className="animate-spin h-12 w-12 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <p className="text-lg text-slate-300 font-medium">กำลังวิเคราะห์ผลลัพธ์ของคุณ...</p>
    <p className="text-sm text-slate-400">กรุณารอสักครู่ Gemini กำลังประมวลผล</p>
  </div>
);

interface ResultCircleProps {
  percentage: number;
}
const ResultCircle: React.FC<ResultCircleProps> = ({ percentage }) => {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="transform -rotate-90" width="200" height="200" viewBox="0 0 200 200">
        <circle
          className="text-slate-700"
          strokeWidth="12"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="100"
          cy="100"
        />
        <circle
          className="text-blue-500 transition-all duration-1000 ease-out"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="100"
          cy="100"
        />
      </svg>
      <span className="absolute text-5xl font-bold text-white">{`${percentage}%`}</span>
    </div>
  );
};


export default function App() {
  const [name, setName] = useState<string>('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<{ score: number; trait: string }[]>([]);
  const [quizState, setQuizState] = useState<'welcome' | 'playing' | 'loading' | 'results'>('welcome');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [heroPercentage, setHeroPercentage] = useState<number>(0);

  const currentQuestion: Question | undefined = QUIZ_QUESTIONS[currentQuestionIndex];

  const handleAnswerSelect = useCallback(async (option: Option) => {
    const newAnswers = [...answers, { score: option.score, trait: currentQuestion!.trait }];
    setAnswers(newAnswers);

    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setQuizState('loading');
      const result = await analyzePersonality(name, newAnswers);
      setAnalysisResult(result.analysis);
      setHeroPercentage(result.percentage);
      setQuizState('results');
    }
  }, [answers, currentQuestionIndex, name, currentQuestion]);

  const handleStart = () => {
    if (name.trim()) {
      setQuizState('playing');
    }
  };

  const handleRestart = () => {
    setName('');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setAnalysisResult('');
    setHeroPercentage(0);
    setQuizState('welcome');
  };
  
  const progressPercentage = useMemo(() => 
    ((currentQuestionIndex) / QUIZ_QUESTIONS.length) * 100, 
    [currentQuestionIndex]
  );

  const renderContent = () => {
    switch (quizState) {
      case 'welcome':
        return (
          <div className="text-center animate-fade-in">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300 mb-4">
              แบบทดสอบคุณสมบัติวีรชน
            </h1>
            <p className="text-slate-300 mb-8 max-w-md mx-auto">
              คุณมีคุณสมบัติของวีรบุรุษหรือวีรสตรีซ่อนอยู่มากแค่ไหน? ตอบคำถาม 5 ข้อเพื่อค้นพบศักยภาพในตัวคุณ
            </p>
            <div className="flex flex-col gap-4 items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="กรุณาใส่ชื่อของคุณ"
                className="w-full max-w-xs px-4 py-2 text-white bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <button
                onClick={handleStart}
                disabled={!name.trim()}
                className="w-full max-w-xs px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg shadow-blue-600/30"
              >
                เริ่มทำแบบทดสอบ
              </button>
            </div>
          </div>
        );
      case 'playing':
        return currentQuestion && (
          <div className="w-full animate-fade-in">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2 text-sm text-slate-400">
                <span>คำถามที่ {currentQuestionIndex + 1} / {QUIZ_QUESTIONS.length}</span>
                <span>{currentQuestion.trait}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2.5">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%`, transition: 'width 0.5s ease-in-out' }}></div>
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-white mb-6 text-center">{currentQuestion.text}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  className="p-4 text-left bg-slate-800 border border-slate-700 rounded-lg hover:bg-blue-900/50 hover:border-blue-500 transition-all duration-200"
                >
                  <p className="text-slate-200">{option.text}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 'loading':
        return <LoadingSpinner />;
      case 'results':
        return (
          <div className="text-center animate-fade-in">
            <h2 className="text-3xl font-bold text-slate-100 mb-2">ผลการวิเคราะห์สำหรับ <span className="text-blue-400">{name}</span></h2>
            <p className="text-lg text-slate-300 mb-6">คุณมีคุณสมบัติของวีรชน</p>
            <ResultCircle percentage={heroPercentage} />
            <p className="mt-6 max-w-lg mx-auto text-slate-300 bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              {analysisResult}
            </p>
            <button
              onClick={handleRestart}
              className="mt-8 px-8 py-3 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors duration-300 shadow-lg shadow-blue-600/30"
            >
              ทำแบบทดสอบอีกครั้ง
            </button>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-blue-900 text-white font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl shadow-2xl shadow-black/30 p-8">
        <div className="flex items-center justify-center">
            {renderContent()}
        </div>
      </div>
    </main>
  );
}
