-- Delete messages from invalid conversations (self-conversations and specific old conversations)
DELETE FROM team_messages
WHERE conversation_id IN (
  '1e4d2321-c582-47a2-9416-8be6fdf95751',  -- Self-conversation
  'dd747ed8-bcd1-47a4-8400-f14b136771ab'   -- Old conversation
);

-- Delete the invalid conversations
DELETE FROM direct_conversations
WHERE id IN (
  '1e4d2321-c582-47a2-9416-8be6fdf95751',  -- Self-conversation (same user as both participants)
  'dd747ed8-bcd1-47a4-8400-f14b136771ab'   -- Older conversation to clean up
);