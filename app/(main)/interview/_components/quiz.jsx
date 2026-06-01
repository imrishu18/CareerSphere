"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generateQuiz, saveQuizResult } from "@/actions/interview";
import QuizResult from "./quiz-result";
import useFetch from "@/hooks/use-fetch";

const difficultyOptions = [
  {
    value: "beginner",
    title: "Beginner",
    description: "Fundamentals and entry-level interview readiness.",
  },
  {
    value: "intermediate",
    title: "Intermediate",
    description: "Scenario-based questions with practical judgment.",
  },
  {
    value: "advanced",
    title: "Advanced",
    description: "Difficult questions for deeper domain confidence.",
  },
];
const optionLabels = ["A", "B", "C", "D"];

function cleanOptionText(option = "") {
  return String(option)
    .replace(/^\s*\d+[\).]\s*/, "")
    .replace(/^\s*[A-D][\).]\s*/i, "")
    .trim();
}

export default function Quiz() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [difficulty, setDifficulty] = useState("beginner");

  const {
    loading: generatingQuiz,
    fn: generateQuizFn,
    data: quizData,
  } = useFetch(generateQuiz);

  const {
    loading: savingResult,
    fn: saveQuizResultFn,
    data: resultData,
    setData: setResultData,
  } = useFetch(saveQuizResult);

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.length).fill(null));
    }
  }, [quizData]);

  const handleAnswer = (answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === quizData[index].correctAnswer) {
        correct++;
      }
    });
    return (correct / quizData.length) * 100;
  };

  const finishQuiz = async () => {
    const score = calculateScore();
    try {
      await saveQuizResultFn(quizData, answers, score);
      toast.success("Quiz completed!");
    } catch (error) {
      toast.error(error.message || "Failed to save quiz results");
    }
  };

  const startNewQuiz = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setShowExplanation(false);
    generateQuizFn(difficulty);
    setResultData(null);
  };

  if (generatingQuiz) {
    return (
      <Card className="mx-2 border-white/10 bg-slate-950/55">
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Preparing your mock interview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Difficulty:{" "}
                {
                  difficultyOptions.find((option) => option.value === difficulty)
                    ?.title
                }
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 10 }).map((_, index) => (
                <span
                  key={index}
                  className="h-2.5 w-7 animate-pulse rounded-full bg-white/15"
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
              <div>
                <p className="text-lg font-semibold leading-7 text-slate-50">
                  Generating interview questions...
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Preparing a focused mock interview for your selected difficulty.
                </p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <div className="h-4 w-11/12 animate-pulse rounded-full bg-white/10" />
              <div className="h-4 w-8/12 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>

          <div className="grid gap-3">
            {optionLabels.map((label, index) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/15 text-[10px] font-semibold text-cyan-200">
                  {label}
                </span>
                <div className="h-4 flex-1 animate-pulse rounded-full bg-white/10" />
                <div
                  className={`hidden h-4 animate-pulse rounded-full bg-white/10 sm:block ${
                    index % 2 === 0 ? "w-20" : "w-28"
                  }`}
                />
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" disabled>
            Show Explanation
          </Button>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" disabled>
              Previous
            </Button>
            <Button disabled>Next Question</Button>
          </div>
        </CardFooter>
      </Card>
    );
  }

  // Show results if quiz is completed
  if (resultData) {
    return (
      <div className="mx-2">
        <QuizResult result={resultData} onStartNew={startNewQuiz} />
      </div>
    );
  }

  if (!quizData) {
    return (
      <Card className="mx-2 border-white/10 bg-slate-950/55">
        <CardHeader>
          <CardTitle>Ready to test your knowledge?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This quiz contains 10 questions specific to your industry,
              skills, and selected difficulty. Take your time and choose the
              best answer for each question.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDifficulty(option.value)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    difficulty === option.value
                      ? "border-cyan-300/35 bg-cyan-400/10 text-slate-50"
                      : "border-white/10 bg-white/[0.035] text-slate-400 hover:border-cyan-300/30 hover:bg-white/[0.06] hover:text-slate-100"
                  }`}
                >
                  <span className="block font-semibold">{option.title}</span>
                  <span className="mt-2 block text-xs leading-5">
                    {option.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={() => generateQuizFn(difficulty)} className="w-full">
            Start Quiz
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const question = quizData[currentQuestion];

  return (
    <Card className="mx-2 border-white/10 bg-slate-950/55">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>
              Question {currentQuestion + 1} of {quizData.length}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {question.domain} | {question.difficulty} | {question.topic}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {quizData.map((_, index) => (
              <span
                key={index}
                className={`h-2.5 w-7 rounded-full ${
                  index === currentQuestion
                    ? "bg-cyan-300"
                    : answers[index]
                      ? "bg-emerald-300/70"
                      : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-lg font-semibold leading-7">{question.question}</p>
        </div>
        <RadioGroup
          onValueChange={handleAnswer}
          value={answers[currentQuestion]}
          className="grid gap-3"
        >
          {question.options.map((option, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-cyan-300/30 hover:bg-white/[0.06]"
            >
              <RadioGroupItem value={option} id={`option-${index}`} />
              <Label htmlFor={`option-${index}`} className="flex-1 leading-6">
                <span className="mr-2 font-semibold text-cyan-200">
                  {optionLabels[index] || `${index + 1}`})
                </span>
                {cleanOptionText(option)}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {showExplanation && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="font-medium">Explanation:</p>
            <p className="text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!showExplanation && (
          <Button
            onClick={() => setShowExplanation(true)}
            variant="outline"
            disabled={!answers[currentQuestion]}
          >
            Show Explanation
          </Button>
        )}
        {showExplanation && <span />}
        <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
          <Button
            onClick={handlePrevious}
            variant="outline"
            disabled={currentQuestion === 0 || savingResult}
            className="flex-1 sm:flex-none"
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!answers[currentQuestion] || savingResult}
            className="flex-1 sm:flex-none"
          >
            {currentQuestion < quizData.length - 1
              ? "Next Question"
              : "Finish Quiz"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
