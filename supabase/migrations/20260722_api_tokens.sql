-- Supabase Migration: API Tokens Table

CREATE TABLE IF NOT EXISTS public.api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own API tokens"
ON public.api_tokens
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role full access
CREATE POLICY "Service role full access on API tokens"
ON public.api_tokens
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- RPC: Get wishlists and recipients for extension
CREATE OR REPLACE FUNCTION public.get_extension_wishlists(token_hash_input TEXT)
RETURNS JSONB AS $$
DECLARE
    ret_user_id UUID;
    result JSONB;
BEGIN
    -- Find user_id
    SELECT user_id INTO ret_user_id FROM public.api_tokens WHERE token_hash = token_hash_input;
    IF ret_user_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Update last used
    UPDATE public.api_tokens SET last_used_at = now() WHERE token_hash = token_hash_input;

    -- Construct JSON result
    SELECT jsonb_build_object(
        'recipients', (
            SELECT COALESCE(jsonb_agg(r), '[]'::jsonb)
            FROM (
                SELECT id, name FROM public.recipients WHERE user_id = ret_user_id ORDER BY name
            ) r
        ),
        'wishlists', (
            SELECT COALESCE(jsonb_agg(w), '[]'::jsonb)
            FROM (
                SELECT id, recipient_id, title FROM public.wishlists 
                WHERE recipient_id IN (SELECT id FROM public.recipients WHERE user_id = ret_user_id)
                ORDER BY title
            ) w
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Add item via extension
CREATE OR REPLACE FUNCTION public.add_extension_item(
    token_hash_input TEXT,
    wishlist_id_input UUID,
    product_name_input TEXT,
    product_url_input TEXT,
    image_url_input TEXT,
    target_price_input NUMERIC
)
RETURNS JSONB AS $$
DECLARE
    ret_user_id UUID;
    is_authorized BOOLEAN;
    inserted_row JSONB;
BEGIN
    -- Find user_id
    SELECT user_id INTO ret_user_id FROM public.api_tokens WHERE token_hash = token_hash_input;
    IF ret_user_id IS NULL THEN
        RAISE EXCEPTION 'Invalid token';
    END IF;

    -- Verify ownership
    SELECT EXISTS (
        SELECT 1 FROM public.wishlists w
        JOIN public.recipients r ON w.recipient_id = r.id
        WHERE w.id = wishlist_id_input AND r.user_id = ret_user_id
    ) INTO is_authorized;

    IF NOT is_authorized THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Update last used
    UPDATE public.api_tokens SET last_used_at = now() WHERE token_hash = token_hash_input;

    -- Insert item
    INSERT INTO public.wishlist_items (
        wishlist_id,
        product_name,
        product_url,
        image_url,
        target_price
    ) VALUES (
        wishlist_id_input,
        product_name_input,
        product_url_input,
        image_url_input,
        target_price_input
    ) RETURNING to_jsonb(public.wishlist_items.*) INTO inserted_row;

    RETURN inserted_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

