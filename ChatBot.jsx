import { useState } from "react";
import { CustomBox } from "../../Lead Tracker/LeaderTrackerStyles";
import ChatHeader from "../../ChatInterface/Common/ChatHeader";
import {
  HeaderBox,
  MainContentBox,
  OptionItemBox,
  StyleTypo,
  ImageBox,
  SelectedOptionsBox,
  OptionsHeaderBox,
  ButtonBox,
  StyledTextField,
  StyledButton,
} from "./ChatBotStyles";
import {
  suggestionIcon,
  reportIcon,
  favouriteIcon,
  attachmentIcon, // Add attachment icon import
} from "../../../Constants/Constant.js";
import theme from "../../../Constants/theme.js";
import { API } from "../../../global.js";
import { Box, IconButton } from "@mui/material"; // Add MUI components for styling

const ChatBot = ({ setShowAIInsights, showAIInsights }) => {
  const options = [
    {
      key: "compliment",
      label: "Give a compliment",
      item: "Tell us what you loved!",
      icon: favouriteIcon,
      bgColor: theme.palette.background.mint,
    },
    {
      key: "problem",
      label: "Report a problem",
      item: "Let us know what went wrong.",
      icon: reportIcon,
      bgColor: theme.palette.background.lightRed,
    },
    {
      key: "suggestion",
      label: "Make a suggestion",
      item: "Have an idea to improve things?",
      icon: suggestionIcon,
      bgColor: theme.palette.background.lightYellow,
    },
  ];

  // State to track current selected option
  const [selectedOption, setSelectedOption] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [attachedFile, setAttachedFile] = useState(null); // Add state for attached file

  // Handle clicking an option
  const handleClick = (optionKey) => {
    const option = options.find((opt) => opt.key === optionKey);
    setSelectedOption(option);
    setTextInput("");
    setAttachedFile(null); // Reset attached file when switching options
  };

  // Handle file attachment
  const handleFileAttachment = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAttachedFile(file);
    }
  };

  // Handle submit
  const handleSubmit = () => {
    const payload = {
      feedback_type: selectedOption.key, // "compliment" | "problem" | "suggestion"
      feedback_content: textInput.trim(),
      attachment: attachedFile ? attachedFile.name : null, // Include attachment info
    };

    // If there's a file attachment, you might want to handle file upload separately
    // This is a basic implementation - you may need to modify based on your backend requirements
    fetch(`${API}/dashboard/create-feedback`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((res) => {
        if (res.success) {
          setFeedback(true);
          setSelectedOption(null);
          setTextInput("");
          setAttachedFile(null);
        } else {
          console.error("Submission failed", res.message);
        }
      })
      .catch((err) => {
        console.error("Error while submitting feedback", err);
      });
  };

  // Handle back button
  const handleBack = () => {
    setSelectedOption(null);
    setTextInput("");
    setAttachedFile(null);
  };

  //Handle Close the component
  const handleClose = () => {
    setShowAIInsights(!showAIInsights);
  };

  return (
    <CustomBox type="chat_bot">
      <HeaderBox>
        <ChatHeader type="chat_bot" />
      </HeaderBox>

      <MainContentBox>
        {/* If no option selected, show the list */}
        {!selectedOption && !feedback && (
          <StyleTypo textAlign="center" pb={1} type="heading">
            We'd love to hear from you, <br /> select one of the options below
            to continue <br />
          </StyleTypo>
        )}

        {!selectedOption &&
          !feedback &&
          options.map((option) => (
            <OptionItemBox
              key={option.key}
              onClick={() => handleClick(option.key)}
            >
              <ImageBox bgColor={option.bgColor}>
                <img
                  src={option.icon}
                  alt={option.label}
                  width={24}
                  height={24}
                  loading="lazy"
                />
              </ImageBox>

              <StyleTypo type="body">
                {option.label.charAt(0).toUpperCase() + option.label.slice(1)}
              </StyleTypo>
            </OptionItemBox>
          ))}

        {/* If an option is selected, show the form */}
        {selectedOption && (
          <SelectedOptionsBox>
            <OptionsHeaderBox>
              <ImageBox bgColor={selectedOption.bgColor}>
                <img
                  src={selectedOption.icon}
                  alt={selectedOption.label}
                  width={24}
                  height={24}
                  loading="lazy"
                />
              </ImageBox>
              <StyleTypo>{selectedOption.label}</StyleTypo>
            </OptionsHeaderBox>

            {/* Text field with attachment icon container */}
            <Box sx={{ position: 'relative', width: '100%' }}>
              <StyledTextField
                multiline
                minRows={4}
                placeholder={`${selectedOption.item}`}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                fullWidth
              />
              
              {/* Attachment icon */}
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
                size="small"
              >
                <img
                  src={attachmentIcon}
                  alt="Attach file"
                  width={20}
                  height={20}
                  loading="lazy"
                />
                <input
                  type="file"
                  hidden
                  onChange={handleFileAttachment}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
              </IconButton>
            </Box>

            {/* Show attached file name if file is selected */}
            {attachedFile && (
              <Box sx={{ mt: 1, p: 1, backgroundColor: theme.palette.background.default, borderRadius: 1 }}>
                <StyleTypo variant="caption" color="textSecondary">
                  Attached: {attachedFile.name}
                </StyleTypo>
              </Box>
            )}

            <ButtonBox>
              <StyledButton variant="outlined" onClick={handleBack}>
                Back
              </StyledButton>

              <StyledButton
                variant="contained"
                onClick={handleSubmit}
                disabled={!textInput.trim()}
              >
                Submit
              </StyledButton>
            </ButtonBox>
          </SelectedOptionsBox>
        )}

        {/* if feedback then show  */}
        {feedback && (
          <>
            <StyleTypo textAlign="center" pb={1}>
              Your feedback has been received. <br /> Thank you for helping us
              improve. Our team may reach out to you for further details if
              needed. <br />
            </StyleTypo>

            <StyledButton variant="outlined" onClick={handleClose}>
              Close
            </StyledButton>
          </>
        )}
      </MainContentBox>
    </CustomBox>
  );
};

export default ChatBot;