"""
Custom Langchain Chat Message History using SQLAlchemy backend.

This allows Langchain Memory components (like ConversationBufferWindowMemory)
to use our existing database `Message` table as the storage layer.
"""
import logging
from typing import List
from uuid import UUID

from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import BaseMessage, message_to_dict, messages_from_dict

# Assuming Session is imported correctly for type hinting
# from sqlalchemy.orm import Session
# Assuming Message model is imported correctly
# from app.models.case import Message

logger = logging.getLogger(__name__)

class SQLChatMessageHistory(BaseChatMessageHistory):
    """Chat message history stored in a SQL database."""

    def __init__(self, db_session: Any, case_id: str): # TODO: Replace Any with Session type hint
        """
        Initialize with database session and case ID.

        Args:
            db_session: SQLAlchemy Session object.
            case_id: The UUID (as string) of the case whose history is being managed.
        """
        # TODO: Import Session and Message model properly
        from sqlalchemy.orm import Session
        from app.models.case import Message as MessageModel # Alias to avoid name clash

        if not isinstance(db_session, Session):
             logger.warning(f"Expected SQLAlchemy Session, got {type(db_session)}. Type checking might fail.")
             # raise TypeError("db_session must be a SQLAlchemy Session")

        self.db: Session = db_session
        self.case_id: UUID = UUID(case_id) # Store as UUID
        self.Message = MessageModel # Store model class

    @property
    def messages(self) -> List[BaseMessage]:  # type: ignore
        """Retrieve messages from database"""
        db_messages = (
            self.db.query(self.Message)
            .filter(self.Message.case_id == self.case_id)
            .order_by(self.Message.created_at.asc())
            .all()
        )

        # Convert DB messages to Langchain message format
        # Assuming Message model has 'role' and 'content' attributes
        items = [{"type": msg.role, "data": {"content": msg.content}} for msg in db_messages]

        # Use Langchain utility to convert dicts to BaseMessage objects
        langchain_messages = messages_from_dict(items)
        return langchain_messages

    def add_message(self, message: BaseMessage) -> None:
        """Append the message to the record in the database"""
        # Convert Langchain message to dict, then extract role and content
        message_dict = message_to_dict(message)
        role = message_dict["type"]
        content = message_dict["data"]["content"]

        # Create SQLAlchemy Message object
        db_message = self.Message(
            case_id=self.case_id,
            role=role,
            content=content,
        )

        # Add to session and commit immediately
        # Note: This assumes immediate persistence is desired for memory.
        # If batching is needed, commit logic might need adjustment.
        try:
            self.db.add(db_message)
            self.db.commit()
            logger.debug(f"Added message to DB for case {self.case_id}: Role={role}")
        except Exception as e:
            logger.error(f"Failed to add message to DB for case {self.case_id}: {e}")
            self.db.rollback()
            # Re-raise or handle as appropriate for the application context
            raise

    def clear(self) -> None:
        """Clear session memory from the database"""
        try:
            (
                self.db.query(self.Message)
                .filter(self.Message.case_id == self.case_id)
                .delete()
            )
            self.db.commit()
            logger.info(f"Cleared message history from DB for case {self.case_id}")
        except Exception as e:
            logger.error(f"Failed to clear message history from DB for case {self.case_id}: {e}")
            self.db.rollback()
            # Re-raise or handle
            raise
