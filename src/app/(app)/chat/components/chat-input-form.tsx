'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal } from 'lucide-react';
import { useLanguage } from '@/contexts/language-context';
import { checkForEmergencyKeywords } from '../actions';
import { LoadingSpinner } from '@/components/shared/loading-spinner';

interface ChatFormInputs {
  message: string;
}

interface ChatInputFormProps {
  onSubmit: (message: string) => Promise<void>;
  isLoading: boolean;
  onEmergencyKeywordDetected: () => void;
}

export function ChatInputForm({ onSubmit, isLoading, onEmergencyKeywordDetected }: ChatInputFormProps) {
  const { t, language } = useLanguage();
  const [isCheckingEmergency, setIsCheckingEmergency] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChatFormInputs>({
    defaultValues: {
      message: ''
    }
  });

  const handleFormSubmit: SubmitHandler<ChatFormInputs> = async (data) => {
    if (!data.message?.trim()) return;
    
    setIsCheckingEmergency(true);
    try {
      const emergencyCheckResult = await checkForEmergencyKeywords({ text: data.message }, language);
      if (emergencyCheckResult.isEmergency) {
        onEmergencyKeywordDetected();
        reset();
        setIsCheckingEmergency(false);
        return;
      }
    } catch (error) {
      console.error("Error checking emergency keywords:", error);
    }
    setIsCheckingEmergency(false);

    if (!isLoading) {
      await onSubmit(data.message);
      reset();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="sticky bottom-0 flex items-start space-x-2 border-t bg-background p-4"
      aria-label={t('chatInputFormLabel') || "Chat input form"}
    >
      <Textarea
        id="message"
        placeholder={t('typeYourMessage') || "Type your message..."}
        className="flex-1 resize-none rounded-xl border-input bg-card p-3 shadow-sm focus-visible:ring-1 focus-visible:ring-ring min-h-[52px] max-h-[150px]"
        rows={1}
        {...register('message', { 
          required: true,
          minLength: 1,
          maxLength: 2000 
        })}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(handleFormSubmit)();
          }
        }}
        aria-invalid={errors.message ? 'true' : 'false'}
        aria-describedby={errors.message ? "message-error" : undefined}
      />
      <Button type="submit" size="icon" className="h-[52px] w-[52px] rounded-xl shrink-0" disabled={isLoading || isCheckingEmergency}>
        {isLoading || isCheckingEmergency ? <LoadingSpinner size={20} /> : <SendHorizonal size={20} />}
        <span className="sr-only">{t('send')}</span>
      </Button>
      {/* Optional: File attachment button
      <Button type="button" variant="ghost" size="icon" className="h-[52px] w-[52px] rounded-xl" disabled={isLoading}>
        <Paperclip size={20} />
        <span className="sr-only">{t('attachFile') || "Attach file"}</span>
      </Button>
      */}
      {errors.message && <p id="message-error" className="sr-only text-sm text-destructive">Message cannot be empty</p>}
    </form>
  );
}
