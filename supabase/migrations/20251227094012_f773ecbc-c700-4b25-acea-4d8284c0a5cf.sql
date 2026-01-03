-- Create transcripts table to store video transcripts
CREATE TABLE public.transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
  youtube_video_id TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'youtube_captions', -- 'youtube_captions' or 'whisper_transcription'
  language TEXT DEFAULT 'en',
  timestamps JSONB DEFAULT '[]'::jsonb, -- Array of {start, end, text} objects
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, youtube_video_id)
);

-- Enable RLS
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own transcripts"
ON public.transcripts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transcripts"
ON public.transcripts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transcripts"
ON public.transcripts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transcripts"
ON public.transcripts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transcripts_updated_at
BEFORE UPDATE ON public.transcripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();