"""
ADK Session Manager - Official Google ADK Implementation
Uses the real Google ADK InMemorySessionService for session management
"""
from google.adk.sessions import InMemorySessionService, Session
from typing import Dict, Any, Optional
import asyncio

# Global session service instance
_session_service: Optional[InMemorySessionService] = None

def get_session_service() -> InMemorySessionService:
    """Get or create the global session service instance"""
    global _session_service
    if _session_service is None:
        _session_service = InMemorySessionService()
        print("✅ ADK Session Service initialized (InMemorySessionService)")
    return _session_service


async def get_or_create_session_async(session_id: str, user_id: str = "default_user") -> Session:
    """
    Get an existing session or create a new one

    Args:
        session_id: Unique session identifier
        user_id: User identifier

    Returns:
        Session object
    """
    service = get_session_service()

    try:
        # Try to get existing session
        session = await service.get_session(
            app_name="flight_risk_radar",
            user_id=user_id,
            session_id=session_id
        )
        print(f"📋 Retrieved existing session: {session_id}")
    except Exception:
        # Create new session if it doesn't exist
        session = await service.create_session(
            app_name="flight_risk_radar",
            user_id=user_id,
            state={"created": True}
        )
        print(f"🆕 Created new session: {session.id}")

    return session


def get_or_create_session(session_id: str, user_id: str = "default_user") -> Session:
    """
    Synchronous wrapper for getting or creating a session

    Args:
        session_id: Unique session identifier
        user_id: User identifier

    Returns:
        Session object
    """
    # Run the async function in a new event loop
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(get_or_create_session_async(session_id, user_id))


async def add_message_to_session_async(session: Session, role: str, content: str, metadata: Optional[Dict] = None) -> None:
    """
    Add a message event to the session

    Args:
        session: Session object
        role: "user" or "assistant"
        content: Message content
        metadata: Optional metadata
    """
    service = get_session_service()

    # Create event data
    event_data = {
        "role": role,
        "content": content,
        "metadata": metadata or {}
    }

    # Append event to session
    await service.append_event(session, event_data)
    print(f"📝 Added {role} message to session {session.id}")


def add_message_to_session(session: Session, role: str, content: str, metadata: Optional[Dict] = None) -> None:
    """
    Synchronous wrapper for adding a message to session

    Args:
        session: Session object
        role: "user" or "assistant"
        content: Message content
        metadata: Optional metadata
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    loop.run_until_complete(add_message_to_session_async(session, role, content, metadata))


def get_session_stats(session: Session) -> Dict[str, Any]:
    """
    Get statistics about a session

    Args:
        session: Session object

    Returns:
        Dictionary with session statistics
    """
    events = session.events if hasattr(session, 'events') else []

    user_messages = sum(1 for e in events if isinstance(e, dict) and e.get('role') == 'user')
    assistant_messages = sum(1 for e in events if isinstance(e, dict) and e.get('role') == 'assistant')

    return {
        "session_id": session.id,
        "user_id": session.user_id,
        "app_name": session.app_name,
        "total_events": len(events),
        "user_messages": user_messages,
        "assistant_messages": assistant_messages,
        "state": session.state
    }
