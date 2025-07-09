import pytest
from datetime import datetime

from ..domain.entities import (
    ConversationMessage,
    CallSummary,
    Call,
    ServiceInfo,
    SpeakerType
)


class TestConversationMessage:
    """Test ConversationMessage entity."""

    def test_create_valid_message(self):
        """Test creating a valid conversation message."""
        message = ConversationMessage(
            speaker=SpeakerType.AI,
            message="Hello, how can I help you?",
            timestamp=datetime.now()
        )
        assert message.speaker == SpeakerType.AI
        assert message.message == "Hello, how can I help you?"
        assert message.is_ai_message is True
        assert message.is_customer_message is False

    def test_create_customer_message(self):
        """Test creating a customer message."""
        message = ConversationMessage(
            speaker=SpeakerType.CUSTOMER,
            message="I need help with my booking",
            timestamp=datetime.now()
        )
        assert message.speaker == SpeakerType.CUSTOMER
        assert message.is_ai_message is False
        assert message.is_customer_message is True

    def test_empty_message_raises_error(self):
        """Test that empty message raises error."""
        with pytest.raises(ValueError, match="Message content cannot be empty"):
            ConversationMessage(
                speaker=SpeakerType.AI,
                message="",
                timestamp=datetime.now()
            )

    def test_whitespace_message_raises_error(self):
        """Test that whitespace-only message raises error."""
        with pytest.raises(ValueError, match="Message content cannot be empty"):
            ConversationMessage(
                speaker=SpeakerType.AI,
                message="   ",
                timestamp=datetime.now()
            )


class TestServiceInfo:
    """Test ServiceInfo value object."""

    def test_create_basic_service_info(self):
        """Test creating basic service info."""
        service = ServiceInfo(name="Emergency Plumbing")
        assert service.name == "Emergency Plumbing"
        assert service.booked is False
        assert service.additional_info is None

    def test_create_booked_service_info(self):
        """Test creating booked service info."""
        service = ServiceInfo(name="Emergency Plumbing", booked=True)
        assert service.name == "Emergency Plumbing"
        assert service.booked is True

    def test_create_service_info_with_additional_info(self):
        """Test creating service info with additional info."""
        additional_info = {"technician": "John Doe", "eta": "30 minutes"}
        service = ServiceInfo(
            name="Emergency Plumbing",
            booked=True,
            additional_info=additional_info
        )
        assert service.additional_info == additional_info


class TestCallSummary:
    """Test CallSummary entity."""

    def test_create_valid_call_summary(self):
        """Test creating a valid call summary."""
        summary = CallSummary(
            call_sid="CA123456789",
            summary="Customer called for emergency plumbing service",
            key_points=["Emergency leak", "Service booked", "30 minute ETA"],
            created_at=datetime.now()
        )
        assert summary.call_sid == "CA123456789"
        assert summary.summary == "Customer called for emergency plumbing service"
        assert len(summary.key_points) == 3

    def test_empty_call_sid_raises_error(self):
        """Test that empty call_sid raises error."""
        with pytest.raises(ValueError, match="Call SID cannot be empty"):
            CallSummary(
                call_sid="",
                summary="Test summary",
                key_points=["Test point"],
                created_at=datetime.now()
            )

    def test_empty_summary_raises_error(self):
        """Test that empty summary raises error."""
        with pytest.raises(ValueError, match="Summary cannot be empty"):
            CallSummary(
                call_sid="CA123456789",
                summary="",
                key_points=["Test point"],
                created_at=datetime.now()
            )

    def test_empty_key_points_raises_error(self):
        """Test that empty key_points raises error."""
        with pytest.raises(ValueError, match="Key points cannot be empty"):
            CallSummary(
                call_sid="CA123456789",
                summary="Test summary",
                key_points=[],
                created_at=datetime.now()
            )


class TestCall:
    """Test Call entity."""

    def test_create_valid_call(self):
        """Test creating a valid call."""
        messages = [
            ConversationMessage(
                speaker=SpeakerType.AI,
                message="Hello",
                timestamp=datetime.now()
            ),
            ConversationMessage(
                speaker=SpeakerType.CUSTOMER,
                message="Hi, I need help",
                timestamp=datetime.now()
            )
        ]
        
        call = Call(
            call_sid="CA123456789",
            conversation=messages
        )
        
        assert call.call_sid == "CA123456789"
        assert call.message_count == 2
        assert len(call.customer_messages) == 1
        assert len(call.ai_messages) == 1
        assert call.has_summary() is False

    def test_add_message_to_call(self):
        """Test adding a message to a call."""
        call = Call(
            call_sid="CA123456789",
            conversation=[]
        )
        
        message = ConversationMessage(
            speaker=SpeakerType.AI,
            message="Hello",
            timestamp=datetime.now()
        )
        
        call.add_message(message)
        assert call.message_count == 1
        assert len(call.ai_messages) == 1

    def test_generate_conversation_text(self):
        """Test generating conversation text."""
        messages = [
            ConversationMessage(
                speaker=SpeakerType.AI,
                message="Hello",
                timestamp=datetime.now()
            ),
            ConversationMessage(
                speaker=SpeakerType.CUSTOMER,
                message="Hi, I need help",
                timestamp=datetime.now()
            )
        ]
        
        call = Call(
            call_sid="CA123456789",
            conversation=messages
        )
        
        text = call.generate_conversation_text()
        expected = "Assistant: Hello\nCustomer: Hi, I need help"
        assert text == expected

    def test_empty_call_sid_raises_error(self):
        """Test that empty call_sid raises error."""
        with pytest.raises(ValueError, match="Call SID cannot be empty"):
            Call(
                call_sid="",
                conversation=[]
            )