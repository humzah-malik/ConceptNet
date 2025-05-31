// src/components/NodeModal.jsx

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  HiX,
  HiArrowLeft,
  HiArrowRight,
  HiCheck,
  HiXCircle
} from 'react-icons/hi'

export default function NodeModal({ node, onClose, graphId }) {
  const [stage, setStage] = useState('summary')
  const [currentQ, setCurrentQ] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [shuffledQuestion, setShuffledQuestion] = useState(null)

  useEffect(() => {
    if (stage === 'quiz') {
      resetQuestion();
    }
  }, [currentQ, stage]);     

  const quiz = node.quiz || []
  const question = shuffledQuestion;
  const correctIndex = question?.answer_index;
  const shuffleArray = (array) => {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const handleSubmit = () => {
    setSubmitted(true)
    recordQuizResult()
  }

  const resetQuestion = () => {
    setSubmitted(false)
    setSelected(null)
  
    // Take the “original” question from quiz[currentQ] and shuffle its options:
    const original = quiz[currentQ]
    if (original) {
      const shuffled = shuffleArray(original.options)
      // Find the new index of the correct answer string:
      const newCorrectIndex = shuffled.findIndex(
        opt => opt === original.options[original.answer_index]
      )
      setShuffledQuestion({
        ...original,
        options: shuffled,
        answer_index: newCorrectIndex
      })
    }
  }

  const recordQuizResult = () => {
    const stats = JSON.parse(localStorage.getItem("quizStats") || "{}");
  
    if (!stats[graphId]) {
      stats[graphId] = {};
    }
  
    const nodeId = node.id;
    if (!stats[graphId][nodeId]) {
      stats[graphId][nodeId] = { attempts: 0, correct: 0, label: node.label };
    }
  
    stats[graphId][nodeId].attempts += 1;
    if (selected === correctIndex) {
      stats[graphId][nodeId].correct += 1;
    }
  
    localStorage.setItem("quizStats", JSON.stringify(stats));
  };    

  return (
    // Backdrop: clicking here calls onClose()
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal panel: stop clicks from bubbling up to backdrop */}
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 overflow-y-auto max-h-[90vh] relative"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-800"
        >
          <HiX className="w-5 h-5" />
        </button>

        {/* ===== SUMMARY STAGE ===== */}
        {stage === 'summary' && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">{node.label}</h2>
            <p className="text-gray-700 whitespace-pre-wrap mb-6">{node.summary}</p>

            {quiz.length > 0 && (
                <div className="flex items-center space-x-4 mt-4">
                    <button
                    onClick={() => {
                        setStage('quiz')
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                    >
                    Take Quiz
                    </button>

                    {graphId && (() => {
                    const stats = JSON.parse(localStorage.getItem("quizStats") || "{}");
                    const nodeStats = stats[graphId]?.[node.id];
                    if (!nodeStats) return null;

                    const { correct, attempts } = nodeStats;
                    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;

                    return (
                        <span className="text-sm text-gray-500">
                        {correct} / {attempts} correct ({accuracy}%)
                        </span>
                    );
                    })()}
                </div>
                )}
          </div>
        )}

        {/* ===== QUIZ STAGE ===== */}
        {stage === 'quiz' && question && (
          <div>
            {/* Header: back to summary & progress */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => {
                  setStage('summary')
                  setCurrentQ(0)
                  resetQuestion()
                }}
                className="text-sm text-gray-500 hover:underline"
              >
                &larr; Back to Summary
              </button>
              <span className="text-sm text-gray-600">
                Question {currentQ + 1} of {quiz.length}
              </span>
            </div>

            {/* Question */}
            <h3 className="text-lg font-medium mb-3">{question.question}</h3>

            {/* Options */}
            <div className="space-y-2">
              {question.options.map((opt, idx) => {
                const isCorrect = submitted && idx === correctIndex
                const isWrong   = submitted && idx === selected && idx !== correctIndex

                return (
                  <button
                    key={idx}
                    onClick={() => !submitted && setSelected(idx)}
                    disabled={submitted}
                    className={`
                      w-full flex items-center px-4 py-2 border rounded transition
                      ${selected === idx ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}
                      ${isCorrect ? 'border-green-500 bg-green-50' : ''}
                      ${isWrong   ? 'border-red-500 bg-red-50'   : ''}
                    `}
                  >
                    {isCorrect && <HiCheck className="text-green-600 mr-2" />}
                    {isWrong   && <HiXCircle className="text-red-500 mr-2" />}
                    <span>{opt}</span>
                  </button>
                )
              })}
            </div>

            {/* Controls: Previous / Submit or Next */}
            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => {
                  setCurrentQ(q => Math.max(q - 1, 0))
                  resetQuestion()
                }}
                disabled={currentQ === 0}
                className="text-sm text-gray-600 hover:underline disabled:opacity-50"
              >
                <HiArrowLeft className="inline mr-1" /> Previous
              </button>

              {!submitted ? (
                <button
                  onClick={handleSubmit}
                  disabled={selected === null}
                  className="bg-indigo-600 text-white px-5 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  Submit
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (currentQ < quiz.length - 1) {
                      setCurrentQ(q => q + 1)
                      resetQuestion()
                    } else {
                      // end of quiz → go back to summary
                      setStage('summary')
                      setCurrentQ(0)
                      resetQuestion()
                    }
                  }}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Next <HiArrowRight className="inline ml-1" />
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}