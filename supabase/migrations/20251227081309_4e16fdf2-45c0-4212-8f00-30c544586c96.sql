-- Add unique constraint for integrations to enable upsert
ALTER TABLE public.integrations 
ADD CONSTRAINT integrations_user_provider_unique UNIQUE (user_id, provider);

-- Add unique constraint for videos to enable upsert
ALTER TABLE public.videos 
ADD CONSTRAINT videos_user_youtube_id_unique UNIQUE (user_id, youtube_video_id);

-- Add unique constraint for comments to enable upsert
ALTER TABLE public.comments 
ADD CONSTRAINT comments_user_youtube_id_unique UNIQUE (user_id, youtube_comment_id);