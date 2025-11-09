"""
Simple Session Storage - Minimal, Non-Breaking Implementation
Stores conversation history in memory without requiring code changes
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

# Global in-memory storage for sessions
_sessions: Dict[str, List[Dict[str, Any]]] = {}


def add_to_session(session_id: str, role: str, content: str, metadata: Optional[Dict] = None) -> None:
    """
    Add a message to session history (fire and forget - no breaking changes)

    Args:
        session_id: Unique session identifier
        role: "user" or "assistant"
        content: Message content
        metadata: Optional metadata
    """
    if not session_id:
        return  # Skip if no session_id

    if session_id not in _sessions:
        _sessions[session_id] = []
        print(f"🆕 SESSION: Created new session {session_id}")

    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata or {}
    }

    _sessions[session_id].append(message)
    print(f"💬 SESSION: Added {role} message to {session_id} (total: {len(_sessions[session_id])})")


def get_session_history(session_id: str, last_n: int = 5) -> List[Dict[str, Any]]:
    """
    Get recent conversation history

    Args:
        session_id: Session to retrieve
        last_n: Number of recent messages to get

    Returns:
        List of recent messages
    """
    if not session_id or session_id not in _sessions:
        return []

    messages = _sessions[session_id][-last_n:]
    print(f"📚 SESSION: Retrieved {len(messages)} messages from {session_id}")
    return messages


def format_session_context(session_id: str, last_n: int = 5) -> str:
    """
    Format session history as text for AI context

    Args:
        session_id: Session to format
        last_n: Number of messages to include

    Returns:
        Formatted context string
    """
    messages = get_session_history(session_id, last_n)

    if not messages:
        return ""

    context = "**Recent Conversation:**\n\n"
    for msg in messages:
        role = msg.get('role', 'unknown').title()
        content = msg.get('content', '')[:200]
        context += f"**{role}:** {content}\n\n"

    return context


def get_session_stats(session_id: str) -> Dict[str, Any]:
    """
    Get statistics about a session

    Args:
        session_id: Session to analyze

    Returns:
        Dictionary with session stats
    """
    if not session_id or session_id not in _sessions:
        return {
            "session_id": session_id,
            "total_messages": 0,
            "exists": False
        }

    messages = _sessions[session_id]
    user_count = sum(1 for m in messages if m.get('role') == 'user')
    assistant_count = sum(1 for m in messages if m.get('role') == 'assistant')

    return {
        "session_id": session_id,
        "total_messages": len(messages),
        "user_messages": user_count,
        "assistant_messages": assistant_count,
        "exists": True
    }


def clear_session(session_id: str) -> None:
    """Clear a session from memory"""
    if session_id in _sessions:
        del _sessions[session_id]
        print(f"🗑️ SESSION: Cleared {session_id}")
