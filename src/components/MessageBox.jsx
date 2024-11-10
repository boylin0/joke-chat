import { memo } from "react";
import PropTypes from 'prop-types'
import {
    Box,
} from "@mui/material";
import MuiMarkdown from 'mui-markdown';
import { Highlight, themes } from 'prism-react-renderer';
import { motion } from 'framer-motion';

const UserMessageBox = memo(({ type, chatContent }) => {

    if (type === 'system') {
        return null;
    }

    const msgBoxStyle = type === 'ai' ? ({
        // TYPE AI
        sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            borderRadius: 3,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            padding: 2,
            px: 3,
            marginBottom: 2,
            wordBreak: 'break-word',
            minHeight: '3rem',
        },
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    }) : ({
        // TYPE Human
        sx: {
            backgroundColor: 'rgb(212 233 246)',
            borderRadius: 3,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            padding: 2,
            px: 3,
            marginBottom: 2,
            wordBreak: 'break-word',
            textAlign: 'right',
            justifyContent: 'flex-end',
            display: 'flex',
            minHeight: '3rem',
        },
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5 }
    })

    return (<Box sx={msgBoxStyle.sx}
      component={motion.div}
      initial={msgBoxStyle.initial}
      animate={msgBoxStyle.animate}
      transition={msgBoxStyle.transition}
    >
      <MuiMarkdown
        Highlight={Highlight}
        theme={themes}
        prismTheme={themes.github}
        >
        {chatContent}
      </MuiMarkdown>
    </Box>
    )
});

UserMessageBox.displayName = 'UserMessageBox';

UserMessageBox.propTypes = {
    type: PropTypes.string.isRequired,
    chatContent: PropTypes.string.isRequired,
};

export default UserMessageBox;
