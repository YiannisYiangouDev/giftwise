'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send } from 'lucide-react'

interface Message {
  id: string
  sender_alias: string
  message: string
  created_at: string
}

export default function SecretSantaChat({ groupId, userId }: { groupId: string; userId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [alias, setAlias] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const hash = userId.split('-').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const aliases = [
      'Cheerful Elf', 'Jolly Reindeer', 'Merry Santa', 'Cozy Snowman',
      'Gingerbread Baker', 'Winter Penguin', 'Candy Cane Master', 'Frosty Jack',
      'Tiny Toymaker', 'Sleigh Rider', 'Sugarplum Fairy', 'Silent Night Singer'
    ]
    const chosen = aliases[hash % aliases.length]
    setAlias(`${chosen} #${hash % 100}`)
  }, [userId])

  useEffect(() => {
    supabase
      .from('santa_chat_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })
      .then(({ data }) => setMessages((data as Message[]) ?? []))

    const channel = supabase
      .channel(`santa_chat:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'santa_chat_messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [groupId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)

    await supabase.from('santa_chat_messages').insert({
      group_id: groupId,
      sender_alias: alias,
      message: text.trim(),
    })

    setText('')
    setSending(false)
  }

  return (
    <div className="card overflow-hidden flex flex-col h-[400px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100/60 dark:border-gray-800/40 flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <MessageSquare size={15} className="text-brand-500" />
          Anonymous Chat
        </h2>
        <span className="text-[9px] bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-800/30 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
          {alias}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <MessageSquare size={24} className="text-gray-200 dark:text-gray-800 mb-2" />
            <p className="text-[11px] text-gray-400">No messages yet. Say hello anonymously!</p>
          </div>
        ) : (
          messages.map(m => {
            const isMe = m.sender_alias === alias
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-slide-up`}>
                <span className="text-[9px] text-gray-400 mb-0.5 px-1 font-medium">{m.sender_alias}</span>
                <div className={`px-4 py-2.5 rounded-2xl text-[13px] max-w-[80%] break-words leading-relaxed ${
                  isMe 
                    ? 'bg-gradient-to-r from-brand-400 to-brand-500 text-white rounded-tr-md shadow-lux-gold' 
                    : 'bg-gray-50 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 rounded-tl-md border border-gray-100/60 dark:border-gray-800/40'
                }`}>
                  {m.message}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t border-gray-100/60 dark:border-gray-800/40 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Send an anonymous message..."
          className="input !py-2 !text-xs !rounded-xl flex-1"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="w-10 h-10 bg-gradient-to-r from-brand-400 to-brand-500 text-white rounded-xl flex items-center justify-center hover:from-brand-500 hover:to-brand-600 disabled:opacity-40 transition-all duration-300 shadow-lux-gold"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}
