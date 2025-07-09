from datetime import datetime

from ..domain.entities import (
    Call,
    ConversationMessage,
    ServiceInfo,
    SpeakerType
)
from ..domain.services import (
    ConversationFormatService,
    SummaryParsingService,
    CallSummaryService,
    ConversationValidationService
)


class TestConversationFormatService:
    """Test ConversationFormatService."""

    def test_format_for_ai_processing(self):
        """Test formatting conversation for AI processing."""
        messages = [
            ConversationMessage(
                speaker=SpeakerType.AI,
                message="Hello, how can I help you?",
                timestamp=datetime.now()
            ),
            ConversationMessage(
                speaker=SpeakerType.CUSTOMER,
                message="I need help with my booking",
                timestamp=datetime.now()
            )
        ]
        
        call = Call(call_sid="CA123456789", conversation=messages)
        formatted = ConversationFormatService.format_for_ai_processing(call)
        
        expected = "Assistant: Hello, how can I help you?\nCustomer: I need help with my booking"
        assert formatted == expected

    def test_create_summary_prompt_without_service_info(self):
        """Test creating summary prompt without service info."""
        messages = [
            ConversationMessage(
                speaker=SpeakerType.AI,
                message="Hello",
                timestamp=datetime.now()
            )
        ]
        
        call = Call(call_sid="CA123456789", conversation=messages)
        prompt = ConversationFormatService.create_summary_prompt(call)
        
        assert "Assistant: Hello" in prompt.value
        assert "Please analyze this customer service call" in prompt.value
        assert "JSON format" in prompt.value

    def test_create_summary_prompt_with_service_info(self):
        """Test creating summary prompt with service info."""
        messages = [
            ConversationMessage(
                speaker=SpeakerType.AI,
                message="Hello",
                timestamp=datetime.now()
            )
        ]
        
        service_info = ServiceInfo(name="Emergency Plumbing", booked=True)
        call = Call(call_sid="CA123456789", conversation=messages, service_info=service_info)
        prompt = ConversationFormatService.create_summary_prompt(call)
        
        assert "Service discussed: Emergency Plumbing" in prompt.value
        assert "Service was booked" in prompt.value


class TestSummaryParsingService:
    """Test SummaryParsingService."""

    def test_parse_valid_json_response(self):
        """Test parsing valid JSON response."""
        json_response = '''
        {
            "summary": "Customer called for emergency plumbing service",
            "keyPoints": ["Water leak", "Emergency service", "Booked plumber"]
        }
        '''
        
        summary, key_points = SummaryParsingService.parse_ai_response(json_response)
        
        assert summary == "Customer called for emergency plumbing service"
        assert len(key_points) == 3
        assert "Water leak" in key_points

    def test_parse_malformed_json_response(self):
        """Test parsing malformed JSON response."""
        malformed_response = "This is not JSON format"
        
        summary, key_points = SummaryParsingService.parse_ai_response(malformed_response)
        
        # Should fall back to default values
        assert summary == "Call completed successfully"
        assert "Customer inquiry handled" in key_points

    def test_parse_response_with_manual_format(self):
        """Test parsing response with manual format."""
        manual_response = '''
        Summary: Customer needed emergency plumbing
        - Water leak in kitchen
        - Service booked for 30 minutes
        - Customer satisfied with response
        '''
        
        summary, key_points = SummaryParsingService.parse_ai_response(manual_response)
        
        assert "Customer needed emergency plumbing" in summary
        assert len(key_points) > 1


class TestCallSummaryService:
    """Test CallSummaryService."""

    def test_create_from_ai_response(self):
        """Test creating call summary from AI response."""
        messages = [
            ConversationMessage(
                speaker=SpeakerType.CUSTOMER,
                message="I have a water leak",
                timestamp=datetime.now()
            )
        ]
        
        call = Call(call_sid="CA123456789", conversation=messages)
        
        ai_response = '''
        {
            "summary": "Customer reported water leak",
            "keyPoints": ["Water leak", "Emergency service needed"]
        }
        '''
        
        summary = CallSummaryService.create_from_ai_response(call, ai_response)
        
        assert summary.call_sid == "CA123456789"
        assert summary.summary == "Customer reported water leak"
        assert len(summary.key_points) == 2

    def test_create_fallback_summary(self):
        """Test creating fallback summary."""
        messages = [
            ConversationMessage(
                speaker=SpeakerType.AI,
                message="Hello",
                timestamp=datetime.now()
            ),
            ConversationMessage(
                speaker=SpeakerType.CUSTOMER,
                message="I need help",
                timestamp=datetime.now()
            )
        ]
        
        service_info = ServiceInfo(name="Emergency Plumbing", booked=True)
        call = Call(call_sid="CA123456789", conversation=messages, service_info=service_info)
        
        summary = CallSummaryService.create_fallback_summary(call)
        
        assert summary.call_sid == "CA123456789"
        assert "Emergency Plumbing" in summary.summary
        assert "2 exchanges" in summary.summary
        assert "Service booking was completed" in summary.key_points


class TestConversationValidationService:
    """Test ConversationValidationService."""

    def test_validate_valid_message_content(self):
        """Test validating valid message content."""
        assert ConversationValidationService.validate_message_content("Hello") is True
        assert ConversationValidationService.validate_message_content("  Hello  ") is True

    def test_validate_invalid_message_content(self):
        """Test validating invalid message content."""
        assert ConversationValidationService.validate_message_content("") is False
        assert ConversationValidationService.validate_message_content("   ") is False
        assert ConversationValidationService.validate_message_content(None) is False

    def test_validate_valid_call_data(self):
        """Test validating valid call data."""
        call_sid = "CA123456789"
        conversation = [
            {"speaker": "AI", "message": "Hello"},
            {"speaker": "customer", "message": "Hi there"}
        ]
        
        assert ConversationValidationService.validate_call_data(call_sid, conversation) is True

    def test_validate_invalid_call_data(self):
        """Test validating invalid call data."""
        # Empty call_sid
        assert ConversationValidationService.validate_call_data("", []) is False
        
        # Invalid conversation format
        assert ConversationValidationService.validate_call_data("CA123", "not a list") is False
        
        # Missing message fields
        invalid_conversation = [{"speaker": "AI"}]  # Missing message
        assert ConversationValidationService.validate_call_data("CA123", invalid_conversation) is False
        
        # Empty message
        invalid_conversation = [{"speaker": "AI", "message": ""}]
        assert ConversationValidationService.validate_call_data("CA123", invalid_conversation) is False