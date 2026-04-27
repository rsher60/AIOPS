
## change from Accepting only PDF to word

                                                                                                      
  Backend (api/server.py):                                                                                           
  - Added _DOC_EXTENSIONS = {"doc", "docx"} constant                                                                 
  - Added parse_docx_content(file_bytes) function that uses python-docx to extract text from paragraphs and tables in
   Word documents                                                                                                    
  - Updated parse_file_content() to check for .doc/.docx first and route to the new parser — before the image/PDF    
  paths
                                                                                                                     
  Frontend (pages/resume.tsx and pages/Roadmap.tsx):                                                                 
  - Added isValidResumeFile() helper that accepts PDF, DOC, and DOCX by both MIME type and file extension            
  - Updated all handleDrop, handleFileChange, handleLinkedinDrop, handleLinkedinFileChange to use the new validator  
  - Changed accept=".pdf" → accept=".pdf,.doc,.docx" on all file inputs                                              
  - Updated UI labels from "PDF files only" → "PDF, DOC, or DOCX"                                                    
                                                                                                                     
  requirements.txt: Added python-docx                                                                                
                                                                                                                     
  Note on .doc vs .docx: python-docx handles .docx (modern XML format) natively. For legacy .doc (binary format), it 
  will attempt parsing and raise a clear error message asking the user to convert to .docx or PDF if it fails. 

  ##  sometimes the panel was not rendering 
  
  Root cause: The frontend only looked for the exact string ---AI_ENHANCEMENTS_START---, but some models (especially 
  Grok/Llama) output variants like _AI_ENHANCEMENT_SUMMARY__, 4. _AI_ENHANCEMENT_SUMMARY__, or                       
  __AI_ENHANCEMENTS_SUMMARY__. When none of these matched, the entire output — including the AI enhancements text —  
  was dumped into the resume panel, and the AI enhancements panel never rendered.                                    
                                                                                                                     
  What changed:                                                                                                      

  1. parseResumeBuffer helper (module-level, reused everywhere) — uses DELIMITER_REGEX which catches all known       
  variants via a single regex: ---AI_ENHANCEMENTS_START---|(?:\d+\.\s*)?_+AI_ENHANCEMENTS?_SUMMARY_+
  2. stripMarkerKeywords — even if a stray marker gets through without being the split point, this strips it from the
   resume content so it never renders in the resume panel.                                                           
  3. onmessage — now calls parseResumeBuffer(buffer) on every chunk; replaces the old single-string indexOf check.
  4. onclose final pass — uses bufferRef to do one last parseResumeBuffer on the complete buffer when the connection 
  closes, catching any delimiter that arrived in the very last SSE chunk before state updates settled.               
                                                                                                           