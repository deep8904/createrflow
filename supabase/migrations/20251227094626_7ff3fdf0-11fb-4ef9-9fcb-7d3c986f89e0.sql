-- Add removed_at column to track when videos were removed from YouTube
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update status default to 'active' for new videos and add comment
COMMENT ON COLUMN public.videos.status IS 'Video status: active, removed, published, processing, scheduled';

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_user_status ON public.videos(user_id, status);