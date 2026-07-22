'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquareShare, MessageSquareReply, Send, HelpCircle, CheckCircle } from 'lucide-react'

interface QAMessage {
  id: string
  giver_user_id: string
  receiver_user_id: string
  question: string
  answer: string | null
  created_at: string
  answered_at: string | null
}

export default function SantaQA({
  groupId,
  userId,
  assignedToUserId,
  assignedName
}: {
  groupId: string
  userId: string
  assignedToUserId: string | null
  assignedName: string
}) {
  const [qaList, setQaList] = useState<QAMessage[]>([])
  const [question, setQuestion] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  // Fetch QAs and subscribe
  useEffect(() => {
    async function loadQA() {
      const { data } = await supabase
        .from('santa_qa_messages')
        .select('*')
        .eq('group_id', groupId)
      setQaList((data as QAMessage[]) ?? [])
    }
    loadQA()

    const channel = supabase
      .channel(`santa_qa:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'santa_qa_messages',
          filter: `group_id=eq.${groupId}`,
        },
        () => {
          loadQA() // re-fetch on change (RLS ensures we only see our own questions/answers)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  async function askQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || !assignedToUserId || sending) return
    setSending(true)

    const { data } = await supabase.from('santa_qa_messages').insert({
      group_id: groupId,
      giver_user_id: userId,
      receiver_user_id: assignedToUserId,
      question: question.trim(),
    }).select('id').single()

    if (data?.id) {
      fetch('/api/secret-santa/notify-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: data.id, type: 'question' }),
      }).catch(console.error)
    }

    setQuestion('')
    setSending(false)
  }

  async function submitAnswer(questionId: string) {
    const text = answers[questionId]?.trim()
    if (!text) return

    await supabase
      .from('santa_qa_messages')
      .update({
        answer: text,
        answered_at: new Date().toISOString(),
      })
      .eq('id', questionId)

    fetch('/api/secret-santa/notify-qa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, type: 'answer' }),
    }).catch(console.error)

    setAnswers(prev => ({ ...prev, [questionId]: '' }))
  }

  // Filter messages
  const myQuestions = qaList.filter(q => q.giver_user_id === userId)
  const incomingQuestions = qaList.filter(q => q.receiver_user_id === userId)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {/* Giver View: Ask your match questions */}
      {assignedToUserId && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col space-y-4">
          <h2 className="font-semibold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <MessageSquareShare size={16} className="text-lux-gold" />
            Ask your match ({assignedName})
          </h2>
          <p className="text-xs text-gray-500">
            Send an anonymous question to your match to find out their sizes, preferences, or shipping details.
          </p>

          <form onSubmit={askQuestion} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. Do you prefer coffee or tea?"
              className="flex-1 px-3 py-2 text-xs border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 focus:ring-1 focus:ring-lux-gold outline-none"
            />
            <button
              type="submit"
              disabled={sending || !question.trim()}
              className="px-3 bg-lux-gold hover:bg-lux-gold-dark text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-40 transition"
            >
              Ask
            </button>
          </form>

          {/* List of asked questions */}
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[220px]">
            {myQuestions.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No questions asked yet.</p>
            ) : (
              myQuestions.map(q => (
                <div key={q.id} className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-800/80 p-3 rounded-lg text-xs space-y-1">
                  <div className="flex items-start gap-1.5 text-gray-700 dark:text-gray-300">
                    <HelpCircle size={14} className="text-lux-gold flex-shrink-0 mt-0.5" />
                    <span className="font-medium">{q.question}</span>
                  </div>
                  {q.answer ? (
                    <div className="flex items-start gap-1.5 text-green-700 dark:text-green-400 pt-1 border-t border-gray-100 dark:border-gray-800/40">
                      <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                      <span>{q.answer}</span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 italic pt-1">Awaiting answer...</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Receiver View: Answer questions from your Secret Santa */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col space-y-4">
        <h2 className="font-semibold text-sm flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <MessageSquareReply size={16} className="text-lux-gold" />
          Questions from your Santa
        </h2>
        <p className="text-xs text-gray-500">
          Your Santa has sent these questions. Answer them to give them helpful hints! (Your identity will be seen, but they remain anonymous).
        </p>

        {/* List of incoming questions */}
        <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px]">
          {incomingQuestions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No questions from your Santa yet.</p>
          ) : (
            incomingQuestions.map(q => (
              <div key={q.id} className="bg-gray-50/50 dark:bg-gray-950/20 border border-gray-100 dark:border-gray-800/80 p-3 rounded-lg text-xs space-y-2">
                <div className="flex items-start gap-1.5 text-gray-700 dark:text-gray-300">
                  <HelpCircle size={14} className="text-lux-gold flex-shrink-0 mt-0.5" />
                  <span className="font-medium">{q.question}</span>
                </div>
                {q.answer ? (
                  <div className="text-gray-500 dark:text-gray-400 pl-5 border-t border-gray-100 dark:border-gray-800/40 pt-1">
                    Your answer: <span className="font-medium text-gray-700 dark:text-gray-300">{q.answer}</span>
                  </div>
                ) : (
                  <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-800/40">
                    <input
                      type="text"
                      value={answers[q.id] || ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Type your answer..."
                      className="flex-1 px-2.5 py-1 text-[11px] border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 focus:ring-1 focus:ring-lux-gold outline-none"
                    />
                    <button
                      onClick={() => submitAnswer(q.id)}
                      disabled={!answers[q.id]?.trim()}
                      className="px-2.5 py-1 bg-lux-gold hover:bg-lux-gold-dark text-white rounded text-[11px] font-semibold disabled:opacity-40 transition"
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
