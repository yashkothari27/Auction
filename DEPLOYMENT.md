# Deployment Checklist

1. Environment Setup:
   - Create .env.production file
   - Set REACT_APP_CONTRACT_ADDRESS
   - Ensure PRIVATE_KEY is not exposed

2. Build Process:
   ```bash
   npm run build
   ```

3. Upload to Hostinger:
   - Upload contents of /build directory to public_html
   - Ensure .htaccess is uploaded with correct permissions (644)
   - Ensure web.config is uploaded (if needed)
   - Set proper permissions (644 for files, 755 for directories)
   - Verify MIME types are correctly set in hosting control panel

4. Server Configuration:
   - Verify mod_mime is enabled
   - Check if mod_headers is enabled
   - Confirm proper MIME type settings
   - Clear server cache if needed

5. Post-Deployment:
   - Clear browser cache
   - Test MetaMask connection
   - Verify contract interaction
   - Check console for errors
   - Test on multiple browsers

6. Common Issues:
   - If MIME type errors persist, contact Hostinger support to verify server configuration
   - Check if mod_mime and mod_headers modules are enabled
   - Verify file permissions are correct
   - Clear both server and browser caches 