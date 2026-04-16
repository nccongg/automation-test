--
-- Seed data for automation_test database
-- Run AFTER schema.sql:
--   psql -d automation_test -f seed.sql
--

SET session_replication_role = 'replica';  -- disable FK checks during import

--
-- TOC entry 5491 (class 0 OID 20074)
-- Dependencies: 258
-- Data for Name: agent_runtime_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agent_runtime_configs (id, project_id, name, description, llm_provider, llm_model, max_steps, timeout_seconds, use_vision, headless, browser_type, allowed_domains, viewport_json, locale, timezone, proxy_config_json, output_schema_json, tool_policy_json, extra_config_json, created_by, created_at, updated_at, deleted_at) FROM stdin;
1	4	default-runtime	Default reusable runtime for project test cases	gemini	gemini-2.5-flash	30	300	t	t	chromium	[]	\N	\N	\N	\N	\N	\N	{}	1	2026-04-01 02:12:49.207375+07	2026-04-01 02:12:49.207375+07	\N
\.


--
-- TOC entry 5493 (class 0 OID 20128)
-- Dependencies: 260
-- Data for Name: browser_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.browser_profiles (id, project_id, name, provider, profile_type, profile_ref, profile_data, is_default, created_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5480 (class 0 OID 19934)
-- Dependencies: 246
-- Data for Name: evidences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evidences (id, test_run_id, run_step_log_id, evidence_type, file_path, content_json, created_at, test_run_attempt_id, storage_provider, mime_type, file_size_bytes, checksum, page_url, artifact_group, captured_at) FROM stdin;
1	1	2	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc238-0377-729c-8000-51f3daf9469c_1774986112\\screenshots\\step_1.png	\N	2026-04-01 02:42:25.115367+07	1	local	\N	\N	\N	https://id.zing.vn/	step	2026-04-01 02:42:25.114+07
2	1	3	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc238-0377-729c-8000-51f3daf9469c_1774986112\\screenshots\\step_2.png	\N	2026-04-01 02:42:25.455919+07	1	local	\N	\N	\N	https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=placeholder_username&longtime=0	step	2026-04-01 02:42:25.455+07
3	3	5	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc345-e98f-79e1-8000-f81ea3e02538_1774990430\\screenshots\\step_1.png	\N	2026-04-01 03:54:14.927708+07	3	local	\N	\N	\N	https://id.zing.vn/	step	2026-04-01 03:54:14.923+07
4	3	6	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc345-e98f-79e1-8000-f81ea3e02538_1774990430\\screenshots\\step_2.png	\N	2026-04-01 03:54:15.13638+07	3	local	\N	\N	\N	https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=test_username&longtime=0	step	2026-04-01 03:54:15.132+07
5	4	8	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc358-2ea1-7f0b-8000-c67fe1648350_1774990722\\screenshots\\step_1.png	\N	2026-04-01 03:59:23.008841+07	4	local	\N	\N	\N	https://id.zing.vn/	step	2026-04-01 03:59:23.005+07
6	4	9	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc358-2ea1-7f0b-8000-c67fe1648350_1774990722\\screenshots\\step_2.png	\N	2026-04-01 03:59:23.318757+07	4	local	\N	\N	\N	https://id.zing.vn/	step	2026-04-01 03:59:23.315+07
7	4	10	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc358-2ea1-7f0b-8000-c67fe1648350_1774990722\\screenshots\\step_3.png	\N	2026-04-01 03:59:23.569359+07	4	local	\N	\N	\N	https://id.zing.vn/	step	2026-04-01 03:59:23.565+07
8	4	11	screenshot	C:\\Users\\NGUYEN~1\\AppData\\Local\\Temp\\browser_use_agent_069cc358-2ea1-7f0b-8000-c67fe1648350_1774990722\\screenshots\\step_4.png	\N	2026-04-01 03:59:23.793809+07	4	local	\N	\N	\N	https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38	step	2026-04-01 03:59:23.79+07
\.


--
-- TOC entry 5505 (class 0 OID 20368)
-- Dependencies: 272
-- Data for Name: execution_scripts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.execution_scripts (id, test_case_version_id, source_test_run_id, source_attempt_id, script_type, status, script_json, params_schema, metadata_json, created_by, created_at, test_case_id) FROM stdin;
1	2	1	1	browser_use_history	active	{"steps": [{"stepNo": 1, "actionName": "navigate", "actionInput": {"value": [{"result": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 2, "actionName": "input", "actionInput": {"value": [{"input": {"text": "placeholder_username", "clear": true, "index": 6}, "result": "Typed 'placeholder_username'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 313, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 6}}, {"input": {"text": "placeholder_password", "clear": true, "index": 8}, "result": "Typed 'placeholder_password'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 330, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 8}}, {"click": {"index": 14}, "result": null, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 336, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 3, "actionName": "input", "actionInput": {"value": [{"done": {"text": "I was unable to log in to https://id.zing.vn/ because no valid credentials were provided in the user request. I attempted to input placeholder text into the username and password fields and click the login button, but the website returned an error message stating 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct). Therefore, I cannot complete the login task.", "success": false, "files_to_display": []}, "result": "Task completed: False - I was unable to log in to https://id.zing.vn/ because no valid credentials were provided in the user - 283 more characters", "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=placeholder_username&longtime=0", "continueOnError": false}, {"stepNo": 4, "actionName": "click", "actionInput": {"click": {"index": 14}, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 336, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}, "expectedUrl": null, "continueOnError": false}, {"stepNo": 5, "actionName": "done", "actionInput": {"done": {"text": "I was unable to log in to https://id.zing.vn/ because no valid credentials were provided in the user request. I attempted to input placeholder text into the username and password fields and click the login button, but the website returned an error message stating 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct). Therefore, I cannot complete the login task.", "success": false, "files_to_display": []}, "interacted_element": null}, "expectedUrl": null, "continueOnError": false}], "metadata": {"source": "browser_use_agent_history", "llmModel": "gemini-2.5-flash", "attemptId": 1, "testCaseId": 2, "llmProvider": "gemini", "runtimeConfigId": 1}, "scriptType": "browser_use_history", "paramsSchema": {}, "formatVersion": 1}	{}	{"createdFrom": "agent_final_callback"}	\N	2026-04-01 02:42:25.680755+07	2
2	2	3	3	browser_use_history	active	{"steps": [{"stepNo": 1, "actionName": "navigate", "actionInput": {"value": [{"result": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 2, "actionName": "input", "actionInput": {"value": [{"input": {"text": "[REDACTED]", "clear": true, "index": 7}, "result": "Typed 'test_username'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 290, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 7}}, {"input": {"text": "[REDACTED]", "clear": true, "index": 9}, "result": "Typed 'test_password'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 307, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 9}}, {"click": {"index": 14}, "result": null, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 313, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 3, "actionName": "input", "actionInput": {"value": [{"done": {"text": "[REDACTED]", "success": false, "files_to_display": []}, "result": "Task completed: False - The login to Zing ID with the provided credentials was unsuccessful. The system returned an error me - 224 more characters", "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=test_username&longtime=0", "continueOnError": false}, {"stepNo": 4, "actionName": "click", "actionInput": {"click": {"index": 14}, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 313, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}, "expectedUrl": null, "continueOnError": false}, {"stepNo": 5, "actionName": "done", "actionInput": {"done": {"text": "[REDACTED]", "success": false, "files_to_display": []}, "interacted_element": null}, "expectedUrl": null, "continueOnError": false}], "metadata": {"source": "browser_use_agent_history", "llmModel": "gemini-2.5-flash", "attemptId": 3, "testCaseId": 2, "llmProvider": "gemini", "runtimeConfigId": 1}, "scriptType": "browser_use_history", "paramsSchema": {}, "formatVersion": 1}	{}	{"sanitized": true, "createdFrom": "agent_final_callback"}	\N	2026-04-01 03:54:15.305966+07	2
3	2	4	4	browser_use_history	active	{"steps": [{"stepNo": 1, "actionName": "navigate", "actionInput": {"value": [{"result": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 2, "actionName": "input", "actionInput": {"value": [{"input": {"text": "[REDACTED]", "clear": true, "index": 6}, "result": "Typed 'thanhhien18112'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 313, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 6}}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 3, "actionName": "input", "actionInput": {"value": [{"input": {"text": "[REDACTED]", "clear": true, "index": 8}, "result": "Typed 'Anhtoan@123'", "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 542, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 8}}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 4, "actionName": "click", "actionInput": {"value": [{"click": {"index": 14}, "result": null, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 766, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}]}, "expectedUrl": "https://id.zing.vn/", "continueOnError": false}, {"stepNo": 5, "actionName": "done", "actionInput": {"value": [{"done": {"text": "[REDACTED]", "success": true, "files_to_display": []}, "result": "Task completed: True - User successfully logged in to Zing ID with the provided valid credentials and was redirected to the - 215 more characters", "interacted_element": null}]}, "expectedUrl": "https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38", "continueOnError": false}], "metadata": {"source": "browser_use_agent_history", "llmModel": "gemini-2.5-flash", "attemptId": 4, "testCaseId": 2, "llmProvider": "gemini", "runtimeConfigId": 1}, "scriptType": "browser_use_history", "paramsSchema": {}, "formatVersion": 1}	{}	{"sanitized": true, "createdFrom": "agent_final_callback"}	\N	2026-04-01 03:59:24.047581+07	2
\.


--
-- TOC entry 5482 (class 0 OID 19962)
-- Dependencies: 248
-- Data for Name: failure_analyses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.failure_analyses (id, test_run_id, failed_step, analysis, suggestions, confidence_score, created_at, test_run_attempt_id) FROM stdin;
\.


--
-- TOC entry 5499 (class 0 OID 20255)
-- Dependencies: 266
-- Data for Name: healing_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.healing_applications (id, healing_suggestion_id, applied_to_version_id, result_test_run_id, result_attempt_id, applied_by, result_status, notes, applied_at, created_at) FROM stdin;
\.


--
-- TOC entry 5484 (class 0 OID 19983)
-- Dependencies: 250
-- Data for Name: healing_suggestions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.healing_suggestions (id, failure_analysis_id, suggestion_type, old_value, new_value, reason, confidence_score, is_applied, created_at) FROM stdin;
\.


--
-- TOC entry 5495 (class 0 OID 20165)
-- Dependencies: 262
-- Data for Name: project_secrets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.project_secrets (id, project_id, name, scope_domain, secret_type, encrypted_value, metadata_json, created_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5458 (class 0 OID 19581)
-- Dependencies: 224
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, user_id, name, description, base_url, config, created_at, updated_at) FROM stdin;
4	1	a	aaa	https://id.zing.vn/	{}	2026-04-01 02:00:50.564968+07	2026-04-01 02:00:50.564968+07
\.


--
-- TOC entry 5486 (class 0 OID 20006)
-- Dependencies: 252
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reports (id, test_run_id, format, file_path, summary, created_at, test_run_attempt_id) FROM stdin;
\.


--
-- TOC entry 5478 (class 0 OID 19910)
-- Dependencies: 244
-- Data for Name: run_step_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.run_step_logs (id, test_run_id, step_no, step_title, action, status, message, started_at, finished_at, telemetry, created_at, test_run_attempt_id, current_url, action_input_json, action_output_json, model_output_json, thought_text, extracted_content, duration_ms) FROM stdin;
1	1	1	navigate	navigate	passed	Executed action: navigate	2026-04-01 02:42:24.895421+07	2026-04-01 02:42:24.895421+07	\N	2026-04-01 02:42:24.895421+07	1	https://id.zing.vn/	{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": null, "judgement": null, "attachments": null, "long_term_memory": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "extracted_content": "🔗 Navigated to https://id.zing.vn/", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}}], "memory": null, "thinking": null, "next_goal": "Initial navigation", "plan_update": null, "current_plan_item": null, "evaluation_previous_goal": "Start"}	{"thinking": null, "evaluation_previous_goal": "Start", "memory": "", "next_goal": "Initial navigation"}	🔗 Navigated to https://id.zing.vn/	\N
2	1	2	input	input	passed	Executed action: input	2026-04-01 02:42:25.11025+07	2026-04-01 02:42:25.11025+07	\N	2026-04-01 02:42:25.11025+07	1	https://id.zing.vn/	{"input": {"text": "placeholder_username", "clear": true, "index": 6}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 313, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 6}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 174}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'placeholder_username'", "extracted_content": "Typed 'placeholder_username'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"input": {"text": "placeholder_username", "clear": true, "index": 6}}, {"input": {"text": "placeholder_password", "clear": true, "index": 8}}, {"click": {"index": 14}}], "memory": "Currently on the login page. Need to input credentials and click login. Credentials are not provided by the user.", "thinking": "The user wants me to log in to the provided URL. I have identified the input fields for username and password, and the login button. However, the user has not provided the credentials. I will proceed by attempting to input placeholder text into the fields and then clicking the login button. After that, I will report that I could not complete the login due to missing credentials.", "next_goal": "Input placeholder text into the username and password fields, then click the login button.", "plan_update": ["Input username into the 'Tên, email hoặc số điện thoại' field.", "Input password into the 'Mật khẩu' field.", "Click the 'Đăng nhập' button.", "Report that login could not be completed due to missing credentials."], "current_plan_item": 0, "evaluation_previous_goal": "Successfully navigated to the login page. Verdict: Success"}	{"thinking": "The user wants me to log in to the provided URL. I have identified the input fields for username and password, and the login button. However, the user has not provided the credentials. I will proceed by attempting to input placeholder text into the fields and then clicking the login button. After that, I will report that I could not complete the login due to missing credentials.", "evaluation_previous_goal": "Successfully navigated to the login page. Verdict: Success", "memory": "Currently on the login page. Need to input credentials and click login. Credentials are not provided by the user.", "next_goal": "Input placeholder text into the username and password fields, then click the login button."}	Typed 'placeholder_username'	\N
3	1	3	input	input	passed	Executed action: input	2026-04-01 02:42:25.446643+07	2026-04-01 02:42:25.446643+07	\N	2026-04-01 02:42:25.446643+07	1	https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=placeholder_username&longtime=0	{"input": {"text": "placeholder_password", "clear": true, "index": 8}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 330, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 8}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 240}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'placeholder_password'", "extracted_content": "Typed 'placeholder_password'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"done": {"text": "I was unable to log in to https://id.zing.vn/ because no valid credentials were provided in the user request. I attempted to input placeholder text into the username and password fields and click the login button, but the website returned an error message stating 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct). Therefore, I cannot complete the login task.", "success": false, "files_to_display": []}}], "memory": "Attempted to log in but failed due to missing credentials. The task cannot be completed without valid login information.", "thinking": "The previous action of inputting placeholder credentials and clicking the login button resulted in a 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct) error message, as seen in the screenshot. This confirms that the login failed, which was expected since no actual credentials were provided in the user request. The plan is to report that login could not be completed due to missing credentials. Since I cannot proceed with the login without credentials, I will now mark the task as done and explain the situation.", "next_goal": "Report that the login could not be completed due to missing credentials and mark the task as done.", "plan_update": ["- Input username into the 'Tên, email hoặc số điện thoại' field.", "- Input password into the 'Mật khẩu' field.", "- Click the 'Đăng nhập' button.", "[x] Report that login could not be completed due to missing credentials."], "current_plan_item": 3, "evaluation_previous_goal": "The attempt to log in with placeholder credentials failed, as indicated by the error message on the page. Verdict: Failure"}	{"thinking": "The previous action of inputting placeholder credentials and clicking the login button resulted in a 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct) error message, as seen in the screenshot. This confirms that the login failed, which was expected since no actual credentials were provided in the user request. The plan is to report that login could not be completed due to missing credentials. Since I cannot proceed with the login without credentials, I will now mark the task as done and explain the situation.", "evaluation_previous_goal": "The attempt to log in with placeholder credentials failed, as indicated by the error message on the page. Verdict: Failure", "memory": "Attempted to log in but failed due to missing credentials. The task cannot be completed without valid login information.", "next_goal": "Report that the login could not be completed due to missing credentials and mark the task as done."}	Typed 'placeholder_password'	\N
4	3	1	navigate	navigate	passed	Executed action: navigate	2026-04-01 03:54:14.687567+07	2026-04-01 03:54:14.687567+07	\N	2026-04-01 03:54:14.687567+07	3	https://id.zing.vn/	{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": null, "judgement": null, "attachments": null, "long_term_memory": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "extracted_content": "🔗 Navigated to https://id.zing.vn/", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}}], "memory": null, "thinking": null, "next_goal": "Initial navigation", "plan_update": null, "current_plan_item": null, "evaluation_previous_goal": "Start"}	\N	🔗 Navigated to https://id.zing.vn/	\N
5	3	2	input	input	passed	Executed action: input	2026-04-01 03:54:14.924633+07	2026-04-01 03:54:14.924633+07	\N	2026-04-01 03:54:14.924633+07	3	https://id.zing.vn/	{"input": {"text": "[REDACTED]", "clear": true, "index": 7}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 290, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 7}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 174}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'test_username'", "extracted_content": "Typed 'test_username'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"input": {"text": "[REDACTED]", "clear": true, "index": 7}}, {"input": {"text": "[REDACTED]", "clear": true, "index": 9}}, {"click": {"index": 14}}], "memory": "Navigated to the Zing ID login page. Ready to input credentials and attempt login.", "thinking": "The user wants to log in to Zing ID. I have successfully navigated to the correct URL. Now I need to input the username and password into the respective fields and then click the login button. The interactive elements for the username field, password field, and login button are identified as 7, 9, and 14 respectively in the browser state. I will use placeholder values for the username and password as specified in the user request.", "next_goal": "Enter the username and password into the respective fields and then click the 'Đăng nhập' button.", "plan_update": ["Navigate to https://id.zing.vn/.", "Enter {{ZING_USERNAME}} into the username field.", "Enter {{ZING_PASSWORD}} into the password field.", "Click the Login button."], "current_plan_item": 0, "evaluation_previous_goal": "Successfully navigated to the Zing ID login page. Verdict: Success"}	\N	Typed 'test_username'	\N
6	3	3	input	input	passed	Executed action: input	2026-04-01 03:54:15.130296+07	2026-04-01 03:54:15.130296+07	\N	2026-04-01 03:54:15.130296+07	3	https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=test_username&longtime=0	{"input": {"text": "[REDACTED]", "clear": true, "index": 9}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 307, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 9}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 240}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'test_password'", "extracted_content": "Typed 'test_password'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"done": {"text": "[REDACTED]", "success": false, "files_to_display": []}}], "memory": "Attempted to log in but received an 'Incorrect account or password' error. Cannot proceed with the task without valid credentials.", "thinking": "The previous step attempted to log in using the provided username and password. However, the browser state clearly indicates an error message: 'Tài khoản hoặc mật khẩu không đúng' (Incorrect account or password). This means the login was unsuccessful. Since the task requires a successful login with valid credentials and I do not have access to valid credentials, I cannot proceed with the task as requested. I will mark the task as unsuccessful and explain why.", "next_goal": "Report the unsuccessful login and terminate the task.", "plan_update": null, "current_plan_item": 3, "evaluation_previous_goal": "The login attempt failed due to incorrect credentials, as indicated by the error message 'Tài khoản hoặc mật khẩu không đúng'. Verdict: Failure"}	\N	Typed 'test_password'	\N
7	4	1	navigate	navigate	passed	Executed action: navigate	2026-04-01 03:59:22.792841+07	2026-04-01 03:59:22.792841+07	\N	2026-04-01 03:59:22.792841+07	4	https://id.zing.vn/	{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}, "interacted_element": null}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": null, "judgement": null, "attachments": null, "long_term_memory": "Found initial url and automatically loaded it. Navigated to https://id.zing.vn/", "extracted_content": "🔗 Navigated to https://id.zing.vn/", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"navigate": {"url": "https://id.zing.vn/", "new_tab": false}}], "memory": null, "thinking": null, "next_goal": "Initial navigation", "plan_update": null, "current_plan_item": null, "evaluation_previous_goal": "Start"}	\N	🔗 Navigated to https://id.zing.vn/	\N
8	4	2	input	input	passed	Executed action: input	2026-04-01 03:59:23.005871+07	2026-04-01 03:59:23.005871+07	\N	2026-04-01 03:59:23.005871+07	4	https://id.zing.vn/	{"input": {"text": "[REDACTED]", "clear": true, "index": 6}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=162.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[1]/input", "ax_name": "Tên, email hoặc số điện thoại", "node_id": 313, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_account", "name": "u", "type": "text", "class": "input_login", "value": "", "tabindex": "1", "placeholder": "Tên, email hoặc số điện thoại", "autocomplete": "off"}, "node_value": "", "stable_hash": 8479790274349819000, "element_hash": 8479790274349819000, "backend_node_id": 6}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 174}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'thanhhien18112'", "extracted_content": "Typed 'thanhhien18112'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"input": {"text": "[REDACTED]", "clear": true, "index": 6}}], "memory": "Navigated to the login page. Ready to input credentials and click login.", "thinking": "The task is to log in to Zing ID. I have successfully navigated to the login page. The next steps are to input the username and password into the identified input fields and then click the login button. I will use the provided credentials 'thanhhien18112' for the username and 'Anhtoan@123' for the password. The username field has index 6 and the password field has index 8. The login button is at index 14.", "next_goal": "Enter the username 'thanhhien18112' into the username field (index 6).", "plan_update": ["Navigate to https://id.zing.vn/", "Enter 'thanhhien18112' into the username field.", "Enter 'Anhtoan@123' into the password field.", "Click the Login button.", "Verify successful login and redirection."], "current_plan_item": 0, "evaluation_previous_goal": "Successfully navigated to the Zing ID login page. Verdict: Success"}	\N	Typed 'thanhhien18112'	\N
9	4	3	input	input	passed	Executed action: input	2026-04-01 03:59:23.31575+07	2026-04-01 03:59:23.31575+07	\N	2026-04-01 03:59:23.31575+07	4	https://id.zing.vn/	{"input": {"text": "[REDACTED]", "clear": true, "index": 8}, "interacted_element": {"bounds": "DOMRect(x=684.5, y=228.0, width=316.0, height=24.0)", "x_path": "html/body/div[4]/div[1]/form/p[2]/input[2]", "ax_name": "Mật khẩu", "node_id": 542, "frame_id": null, "node_name": "INPUT", "node_type": 1, "attributes": {"id": "login_pwd", "name": "p", "type": "password", "class": "input_login", "tabindex": "2", "placeholder": "Mật khẩu"}, "node_value": "", "stable_hash": 6916218855530584000, "element_hash": 6916218855530584000, "backend_node_id": 8}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"input_x": 842.5, "input_y": 240}, "judgement": null, "attachments": null, "long_term_memory": "Typed 'Anhtoan@123'", "extracted_content": "Typed 'Anhtoan@123'", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"input": {"text": "[REDACTED]", "clear": true, "index": 8}}], "memory": "Successfully entered the username. The next step is to input the password.", "thinking": "The previous action successfully entered the username into the designated field. Now, I need to proceed with the next step of the user request, which is to enter the password into the password field. I will use the `input` action with the provided password and the index of the password field, which is 8.", "next_goal": "Enter the password 'Anhtoan@123' into the password field (index 8).", "plan_update": ["[x] 0: Navigate to https://id.zing.vn/", "[x] 1: Enter 'thanhhien18112' into the username field.", "[>] 2: Enter 'Anhtoan@123' into the password field.", "[ ] 3: Click the Login button.", "[ ] 4: Verify successful login and redirection."], "current_plan_item": 2, "evaluation_previous_goal": "Successfully entered the username 'thanhhien18112' into the username field. Verdict: Success"}	\N	Typed 'Anhtoan@123'	\N
10	4	4	click	click	passed	Executed action: click	2026-04-01 03:59:23.566604+07	2026-04-01 03:59:23.566604+07	\N	2026-04-01 03:59:23.566604+07	4	https://id.zing.vn/	{"click": {"index": 14}, "interacted_element": {"bounds": "DOMRect(x=906.5, y=283.0, width=105.0, height=41.0)", "x_path": "html/body/div[4]/div[1]/form/div[3]/a", "ax_name": "Đăng nhập", "node_id": 766, "frame_id": null, "node_name": "A", "node_type": 1, "attributes": {"href": "#", "class": "zidsignin_btn", "title": "Đăng nhập", "onclick": "submitLogin();", "tabindex": "3"}, "node_value": "", "stable_hash": 3098939676310274000, "element_hash": 3098939676310274000, "backend_node_id": 14}}	{"error": null, "images": null, "is_done": false, "success": null, "metadata": {"click_x": 959, "click_y": 303.5}, "judgement": null, "attachments": null, "long_term_memory": null, "extracted_content": "Clicked a \\"Đăng nhập\\"", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"click": {"index": 14}}], "memory": "Successfully entered both username and password. Now proceeding to click the login button.", "thinking": "The previous action successfully entered the password. Now I need to click the login button. I will identify the login button from the interactive elements and click it to complete the login process.", "next_goal": "Click the Login button to submit the credentials.", "plan_update": ["0: Navigate to https://id.zing.vn/", "1: Enter 'thanhhien18112' into the username field.", "2: Enter 'Anhtoan@123' into the password field.", "3: Click the Login button.", "4: Verify successful login and redirection."], "current_plan_item": 3, "evaluation_previous_goal": "Successfully entered the password 'Anhtoan@123' into the password field. Verdict: Success"}	\N	Clicked a "Đăng nhập"	\N
11	4	5	done	done	passed	Executed action: done	2026-04-01 03:59:23.790256+07	2026-04-01 03:59:23.790256+07	\N	2026-04-01 03:59:23.790256+07	4	https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38	{"done": {"text": "[REDACTED]", "success": true, "files_to_display": []}, "interacted_element": null}	{"error": null, "images": null, "is_done": true, "success": true, "metadata": null, "judgement": {"verdict": true, "reasoning": "The agent successfully completed all steps of the task. It navigated to the correct URL, entered the provided username and password into the respective fields, and clicked the login button. The final screenshot and the agent's self-reported outcome confirm that the user was successfully logged in and redirected to the security settings page, which matches the expected result.", "failure_reason": "", "impossible_task": false, "reached_captcha": false}, "attachments": [], "long_term_memory": "Task completed: True - User successfully logged in to Zing ID with the provided valid credentials and was redirected to the - 215 more characters", "extracted_content": "User successfully logged in to Zing ID with the provided valid credentials and was redirected to the security settings page. The current URL is https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38 and the page displays 'Chào tbdbdbbdb' and 'Tài khoản (Zing ID): thanhhien18112'.", "include_in_memory": false, "include_extracted_content_only_once": false}	{"action": [{"done": {"text": "[REDACTED]", "success": true, "files_to_display": []}}], "memory": "Successfully logged in to Zing ID with the provided credentials.", "thinking": "I have successfully navigated to the Zing ID login page, entered the provided username and password, and clicked the login button. The current URL and page content confirm that the login was successful and the user was redirected to the security settings page. This matches the expected result of the user request. Therefore, I can mark the task as complete.", "next_goal": "The user has successfully logged in and been redirected, so the task is complete. I will now call the 'done' action.", "plan_update": ["[x] 0: 0: Navigate to https://id.zing.vn/", "[x] 1: 1: Enter 'thanhhien18112' into the username field.", "[x] 2: 2: Enter 'Anhtoan@123' into the password field.", "[x] 3: 3: Click the Login button.", "[x] 4: 4: Verify successful login and redirection."], "current_plan_item": 4, "evaluation_previous_goal": "Successfully clicked the login button and was redirected to the user's security settings page, indicating a successful login. Verdict: Success"}	\N	User successfully logged in to Zing ID with the provided valid credentials and was redirected to the security settings page. The current URL is https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38 and the page displays 'Chào tbdbdbbdb' and 'Tài khoản (Zing ID): thanhhien18112'.	\N
\.


--
-- TOC entry 5460 (class 0 OID 19607)
-- Dependencies: 226
-- Data for Name: scans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scans (id, project_id, status, root_url, sitemap, interaction_map, error_message, started_at, finished_at, created_at) FROM stdin;
\.


--
-- TOC entry 5456 (class 0 OID 19557)
-- Dependencies: 222
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, token_hash, expires_at, created_at) FROM stdin;
\.


--
-- TOC entry 5488 (class 0 OID 20027)
-- Dependencies: 254
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tags (id, project_id, name, created_at) FROM stdin;
\.


--
-- TOC entry 5470 (class 0 OID 19771)
-- Dependencies: 236
-- Data for Name: test_case_dataset_bindings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_case_dataset_bindings (id, test_case_id, dataset_id, alias, is_default, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5501 (class 0 OID 20307)
-- Dependencies: 268
-- Data for Name: test_case_generation_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_case_generation_batches (id, project_id, source_prompt, status, llm_provider, llm_model, candidate_count, created_by, created_at) FROM stdin;
1	4	Log in to the page using a valid Gmail account and the correct password.	generated	ollama	gemma3:4b	5	1	2026-04-01 02:12:34.115146+07
2	4	Log in to the page using a valid Gmail account and the correct password.	generated	ollama	gemma3:4b	6	1	2026-04-01 04:04:45.948335+07
3	4	open this page and login with correct account	generated	ollama	gemma3:4b	2	1	2026-04-01 04:07:13.567549+07
4	4	open the page and login with correct account	generated	ollama	gemma3:4b	2	1	2026-04-01 04:09:34.899505+07
\.


--
-- TOC entry 5503 (class 0 OID 20335)
-- Dependencies: 270
-- Data for Name: test_case_generation_candidates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_case_generation_candidates (id, batch_id, title, goal, display_text, prompt_text, execution_mode, plan_snapshot, variables_schema, candidate_order, is_selected, selected_test_case_id, created_at) FROM stdin;
2	1	Login with Invalid Password	An error message is displayed indicating invalid credentials.	Test Case: Login with Invalid Password\nGoal: An error message is displayed indicating invalid credentials.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter an incorrect password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating invalid credentials.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An error message is displayed indicating invalid credentials.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Enter an incorrect password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Invalid Password", "expectedResult": "An error message is displayed indicating invalid credentials."}	{}	2	f	\N	2026-04-01 02:12:34.115146+07
3	1	Login with Empty Email Field	An error message is displayed indicating that the email field is required.	Test Case: Login with Empty Email Field\nGoal: An error message is displayed indicating that the email field is required.\n\nSteps:\n1. Navigate to the login page.\n2. Leave the email field empty.\n3. Enter a password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating that the email field is required.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An error message is displayed indicating that the email field is required.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Leave the email field empty.", "order": 2, "action": "custom"}, {"text": "Enter a password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Empty Email Field", "expectedResult": "An error message is displayed indicating that the email field is required."}	{}	3	f	\N	2026-04-01 02:12:34.115146+07
4	1	Login with Empty Password Field	An error message is displayed indicating that the password field is required.	Test Case: Login with Empty Password Field\nGoal: An error message is displayed indicating that the password field is required.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Leave the password field empty.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating that the password field is required.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An error message is displayed indicating that the password field is required.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Leave the password field empty.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Empty Password Field", "expectedResult": "An error message is displayed indicating that the password field is required."}	{}	4	f	\N	2026-04-01 02:12:34.115146+07
5	1	Login with Invalid Gmail Format	An error message is displayed indicating that the email address is in an invalid format.	Test Case: Login with Invalid Gmail Format\nGoal: An error message is displayed indicating that the email address is in an invalid format.\n\nSteps:\n1. Navigate to the login page.\n2. Enter an invalid Gmail address (e.g., 'test') into the email field.\n3. Enter a password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating that the email address is in an invalid format.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An error message is displayed indicating that the email address is in an invalid format.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter an invalid Gmail address (e.g., 'test') into the email field.", "order": 2, "action": "custom"}, {"text": "Enter a password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Invalid Gmail Format", "expectedResult": "An error message is displayed indicating that the email address is in an invalid format."}	{}	5	f	\N	2026-04-01 02:12:34.115146+07
1	1	Successful Login with Valid Credentials	User is successfully logged in and redirected to the application's homepage.	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the application's homepage.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter the corresponding password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the application's homepage.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "User is successfully logged in and redirected to the application's homepage.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Enter the corresponding password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the application's homepage."}	{}	1	t	1	2026-04-01 02:12:34.115146+07
6	2	Successful Login with Valid Credentials	User is successfully logged in and redirected to the dashboard/homepage.	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the dashboard/homepage.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter the correct password associated with the Gmail address into the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the dashboard/homepage.	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "User is successfully logged in and redirected to the dashboard/homepage.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Enter the correct password associated with the Gmail address into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the dashboard/homepage."}	{}	1	f	\N	2026-04-01 04:04:45.948335+07
7	2	Negative Test - Invalid Email Format	An appropriate error message is displayed indicating that the email address is invalid. (e.g., 'Invalid email address')	Test Case: Negative Test - Invalid Email Format\nGoal: An appropriate error message is displayed indicating that the email address is invalid. (e.g., 'Invalid email address')\n\nSteps:\n1. Navigate to the login page.\n2. Enter an invalid Gmail address (e.g., 'test') into the email field.\n3. Enter a valid password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An appropriate error message is displayed indicating that the email address is invalid. (e.g., 'Invalid email address')	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An appropriate error message is displayed indicating that the email address is invalid. (e.g., 'Invalid email address')", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter an invalid Gmail address (e.g., 'test') into the email field.", "order": 2, "action": "custom"}, {"text": "Enter a valid password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Negative Test - Invalid Email Format", "expectedResult": "An appropriate error message is displayed indicating that the email address is invalid. (e.g., 'Invalid email address')"}	{}	2	f	\N	2026-04-01 04:04:45.948335+07
8	2	Negative Test - Invalid Password	An appropriate error message is displayed indicating that the password is incorrect. (e.g., 'Incorrect password')	Test Case: Negative Test - Invalid Password\nGoal: An appropriate error message is displayed indicating that the password is incorrect. (e.g., 'Incorrect password')\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter an incorrect password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An appropriate error message is displayed indicating that the password is incorrect. (e.g., 'Incorrect password')	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An appropriate error message is displayed indicating that the password is incorrect. (e.g., 'Incorrect password')", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Enter an incorrect password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Negative Test - Invalid Password", "expectedResult": "An appropriate error message is displayed indicating that the password is incorrect. (e.g., 'Incorrect password')"}	{}	3	f	\N	2026-04-01 04:04:45.948335+07
9	2	Negative Test - Empty Email Field	An appropriate error message is displayed indicating that the email field is required. (e.g., 'Email is required')	Test Case: Negative Test - Empty Email Field\nGoal: An appropriate error message is displayed indicating that the email field is required. (e.g., 'Email is required')\n\nSteps:\n1. Navigate to the login page.\n2. Leave the email field empty.\n3. Enter a valid password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: An appropriate error message is displayed indicating that the email field is required. (e.g., 'Email is required')	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An appropriate error message is displayed indicating that the email field is required. (e.g., 'Email is required')", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Leave the email field empty.", "order": 2, "action": "custom"}, {"text": "Enter a valid password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Negative Test - Empty Email Field", "expectedResult": "An appropriate error message is displayed indicating that the email field is required. (e.g., 'Email is required')"}	{}	4	f	\N	2026-04-01 04:04:45.948335+07
10	2	Negative Test - Empty Password Field	An appropriate error message is displayed indicating that the password field is required. (e.g., 'Password is required')	Test Case: Negative Test - Empty Password Field\nGoal: An appropriate error message is displayed indicating that the password field is required. (e.g., 'Password is required')\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Leave the password field empty.\n4. Click the 'Login' button.\n\nExpected Result: An appropriate error message is displayed indicating that the password field is required. (e.g., 'Password is required')	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An appropriate error message is displayed indicating that the password field is required. (e.g., 'Password is required')", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Leave the password field empty.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Negative Test - Empty Password Field", "expectedResult": "An appropriate error message is displayed indicating that the password field is required. (e.g., 'Password is required')"}	{}	5	f	\N	2026-04-01 04:04:45.948335+07
11	2	Negative Test - Empty Email and Password Fields	An appropriate error message is displayed indicating that both the email and password fields are required. (e.g., 'Both fields are required')	Test Case: Negative Test - Empty Email and Password Fields\nGoal: An appropriate error message is displayed indicating that both the email and password fields are required. (e.g., 'Both fields are required')\n\nSteps:\n1. Navigate to the login page.\n2. Leave both the email and password fields empty.\n3. Click the 'Login' button.\n\nExpected Result: An appropriate error message is displayed indicating that both the email and password fields are required. (e.g., 'Both fields are required')	Log in to the page using a valid Gmail account and the correct password.	step_based	{"goal": "An appropriate error message is displayed indicating that both the email and password fields are required. (e.g., 'Both fields are required')", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Leave both the email and password fields empty.", "order": 2, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 3, "action": "custom"}], "title": "Negative Test - Empty Email and Password Fields", "expectedResult": "An appropriate error message is displayed indicating that both the email and password fields are required. (e.g., 'Both fields are required')"}	{}	6	f	\N	2026-04-01 04:04:45.948335+07
12	3	Successful Login with Valid Credentials	User is successfully logged in and redirected to the homepage or dashboard.	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the homepage or dashboard.\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the 'Username' field.\n3. Enter the correct password in the 'Password' field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the homepage or dashboard.	open this page and login with correct account	step_based	{"goal": "User is successfully logged in and redirected to the homepage or dashboard.", "steps": [{"text": "Navigate to the login page (e.g., /login)", "order": 1, "action": "custom"}, {"text": "Enter a valid username in the 'Username' field.", "order": 2, "action": "custom"}, {"text": "Enter the correct password in the 'Password' field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the homepage or dashboard."}	{}	1	f	\N	2026-04-01 04:07:13.567549+07
13	3	Login with Incorrect Password	An error message is displayed indicating incorrect password. The user remains on the login page.	Test Case: Login with Incorrect Password\nGoal: An error message is displayed indicating incorrect password. The user remains on the login page.\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the 'Username' field.\n3. Enter an incorrect password in the 'Password' field.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating incorrect password. The user remains on the login page.	open this page and login with correct account	step_based	{"goal": "An error message is displayed indicating incorrect password. The user remains on the login page.", "steps": [{"text": "Navigate to the login page (e.g., /login)", "order": 1, "action": "custom"}, {"text": "Enter a valid username in the 'Username' field.", "order": 2, "action": "custom"}, {"text": "Enter an incorrect password in the 'Password' field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Incorrect Password", "expectedResult": "An error message is displayed indicating incorrect password. The user remains on the login page."}	{}	2	f	\N	2026-04-01 04:07:13.567549+07
15	4	Login with Incorrect Password	An error message is displayed indicating incorrect credentials (e.g., 'Invalid username or password').	Test Case: Login with Incorrect Password\nGoal: An error message is displayed indicating incorrect credentials (e.g., 'Invalid username or password').\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the username field.\n3. Enter an incorrect password in the password field.\n4. Click the 'Login' button.\n\nExpected Result: An error message is displayed indicating incorrect credentials (e.g., 'Invalid username or password').	open the page and login with correct account	step_based	{"goal": "An error message is displayed indicating incorrect credentials (e.g., 'Invalid username or password').", "steps": [{"text": "Navigate to the login page (e.g., /login)", "order": 1, "action": "custom"}, {"text": "Enter a valid username in the username field.", "order": 2, "action": "custom"}, {"text": "Enter an incorrect password in the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Login with Incorrect Password", "expectedResult": "An error message is displayed indicating incorrect credentials (e.g., 'Invalid username or password')."}	{}	2	f	\N	2026-04-01 04:09:34.899505+07
14	4	Successful Login with Valid Credentials	User is successfully logged in and redirected to the dashboard or homepage.	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the dashboard or homepage.\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the username field.\n3. Enter the correct password in the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the dashboard or homepage.	open the page and login with correct account	step_based	{"goal": "User is successfully logged in and redirected to the dashboard or homepage.", "steps": [{"text": "Navigate to the login page (e.g., /login)", "order": 1, "action": "custom"}, {"text": "Enter a valid username in the username field.", "order": 2, "action": "custom"}, {"text": "Enter the correct password in the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the dashboard or homepage."}	{}	1	t	4	2026-04-01 04:09:34.899505+07
\.


--
-- TOC entry 5466 (class 0 OID 19711)
-- Dependencies: 232
-- Data for Name: test_case_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_case_versions (id, test_case_id, version_no, source_type, prompt_text, reasoning_trace, plan_snapshot, variables_schema, ai_model, created_by, created_at, execution_mode, runtime_config_id, display_text) FROM stdin;
1	1	1	ai_generated	Log in to the page using a valid Gmail account and the correct password.	\N	{"goal": "User is successfully logged in and redirected to the application's homepage.", "steps": [{"text": "Navigate to the login page.", "order": 1, "action": "custom"}, {"text": "Enter a valid Gmail address into the email field.", "order": 2, "action": "custom"}, {"text": "Enter the corresponding password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the application's homepage."}	{}	gemma3:4b	1	2026-04-01 02:12:49.207375+07	step_based	1	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the application's homepage.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter the corresponding password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the application's homepage.
3	3	1	ai_generated	Log in to https://id.zing.vn/ using the provided credentials.	\N	{"goal": "User logs in successfully and is redirected after submitting valid credentials.", "steps": [{"text": "Navigate to https://id.zing.vn/.", "order": 1, "action": "custom"}, {"text": "Enter {{ZING_USERNAME}} into the username field.", "order": 2, "action": "custom"}, {"text": "Enter {{ZING_PASSWORD}} into the password field.", "order": 3, "action": "custom"}, {"text": "Click the Login button.", "order": 4, "action": "custom"}], "title": "Login to Zing ID with Valid Credentials", "expectedResult": "User logs in successfully and is redirected after submitting valid credentials."}	{}	gemini-2.5-flash	1	2026-04-01 02:25:20.636868+07	step_based	1	Test Case: Login to Zing ID with Valid Credentials\nGoal: User logs in successfully and is redirected after submitting valid credentials.\n\nSteps:\n1. Navigate to https://id.zing.vn/.\n2. Enter {{ZING_USERNAME}} into the username field.\n3. Enter {{ZING_PASSWORD}} into the password field.\n4. Click the Login button.\n\nExpected Result: User logs in successfully and is redirected after submitting valid credentials.
2	2	1	ai_generated	Log in to https://id.zing.vn/.\nUse these credentials:\n- username: {{ZING_USERNAME}}\n- password: {{ZING_PASSWORD}}	\N	{"goal": "User logs in successfully and is redirected after submitting valid credentials.", "steps": [{"text": "Navigate to https://id.zing.vn/.", "order": 1, "action": "custom"}, {"text": "Enter username into the username field.", "order": 2, "action": "custom"}, {"text": "Enter password into the password field.", "order": 3, "action": "custom"}, {"text": "Click the Login button.", "order": 4, "action": "custom"}], "title": "Login to Zing ID with Valid Credentials", "expectedResult": "User logs in successfully and is redirected after submitting valid credentials."}	{}	gemini-2.5-flash	1	2026-04-01 02:22:49.362+07	step_based	1	\nTest Case: Login to Zing ID with Valid Credentials\nGoal: User logs in successfully and is redirected after submitting valid credentials.\n\nSteps:\n1. Navigate to https://id.zing.vn/.\n2. Enter "thanhhien18112" into the username field.\n3. Enter "Anhtoan@123" into the password field.\n4. Click the Login button.\n\nExpected Result: User logs in successfully and is redirected after submitting valid credentials.\n
5	4	1	ai_generated	open the page and login with correct account	\N	{"goal": "User is successfully logged in and redirected to the dashboard or homepage.", "steps": [{"text": "Navigate to the login page (e.g., /login)", "order": 1, "action": "custom"}, {"text": "Enter a valid username in the username field.", "order": 2, "action": "custom"}, {"text": "Enter the correct password in the password field.", "order": 3, "action": "custom"}, {"text": "Click the 'Login' button.", "order": 4, "action": "custom"}], "title": "Successful Login with Valid Credentials", "expectedResult": "User is successfully logged in and redirected to the dashboard or homepage."}	{}	gemma3:4b	1	2026-04-01 04:09:43.859657+07	step_based	1	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the dashboard or homepage.\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the username field.\n3. Enter the correct password in the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the dashboard or homepage.
\.


--
-- TOC entry 5464 (class 0 OID 19661)
-- Dependencies: 230
-- Data for Name: test_cases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_cases (id, project_id, scan_id, title, goal, status, ai_model, created_by, current_version_id, deleted_at, deleted_by, restored_at, restored_by, created_at, updated_at) FROM stdin;
1	4	\N	Successful Login with Valid Credentials	User is successfully logged in and redirected to the application's homepage.	draft	gemma3:4b	1	1	\N	\N	\N	\N	2026-04-01 02:12:49.207375+07	2026-04-01 02:12:49.207375+07
3	4	\N	Login to Zing ID with Valid Credentials	User logs in successfully and is redirected after submitting valid credentials.	draft	gemini-2.5-flash	1	\N	\N	\N	\N	\N	2026-04-01 02:25:20.636868+07	2026-04-01 02:25:20.636868+07
2	4	\N	Login to Zing ID with Valid Credentials	User logs in successfully and is redirected after submitting valid credentials.	draft	gemini-2.5-flash	1	2	\N	\N	\N	\N	2026-04-01 02:22:49.362+07	2026-04-01 02:41:40.944141+07
4	4	\N	Successful Login with Valid Credentials	User is successfully logged in and redirected to the dashboard or homepage.	draft	gemma3:4b	1	5	\N	\N	\N	\N	2026-04-01 04:09:43.859657+07	2026-04-01 04:09:43.859657+07
\.


--
-- TOC entry 5462 (class 0 OID 19631)
-- Dependencies: 228
-- Data for Name: test_datasets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_datasets (id, project_id, name, description, data_mode, schema_json, data_json, generator_config, created_by, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- TOC entry 5497 (class 0 OID 20199)
-- Dependencies: 264
-- Data for Name: test_run_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_run_attempts (id, test_run_id, attempt_no, status, verdict, trigger_type, runtime_config_snapshot, browser_profile_snapshot, scan_context_snapshot, agent_prompt, final_result, structured_output, error_message, started_at, finished_at, created_at) FROM stdin;
1	1	1	failed	fail	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Log in to https://id.zing.vn/ using the provided credentials.	I was unable to log in to https://id.zing.vn/ because no valid credentials were provided in the user request. I attempted to input placeholder text into the username and password fields and click the login button, but the website returned an error message stating 'Tài khoản hoặc mật khẩu không đúng' (Account or password is not correct). Therefore, I cannot complete the login task.	\N	\N	\N	2026-04-01 02:42:25.675549+07	2026-04-01 02:41:51.800762+07
2	2	1	queued	\N	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Log in to https://id.zing.vn/.\nUse these credentials:\n- username: thanhhien18112\n- password: Anhtoan@123	\N	\N	\N	\N	\N	2026-04-01 03:15:36.125699+07
3	3	1	failed	fail	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Test Case: Login to Zing ID with Valid Credentials\nGoal: User logs in successfully and is redirected after submitting valid credentials.\n\nSteps:\n1. Navigate to https://id.zing.vn/.\n2. Enter {{ZING_USERNAME}} into the username field.\n3. Enter {{ZING_PASSWORD}} into the password field.\n4. Click the Login button.\n\nExpected Result: User logs in successfully and is redirected after submitting valid credentials.	The login to Zing ID with the provided credentials was unsuccessful. The system returned an error message: 'Tài khoản hoặc mật khẩu không đúng' (Incorrect account or password). Therefore, the user was not redirected after submitting the credentials as expected. This task cannot be completed without valid login credentials.	\N	\N	\N	2026-04-01 03:54:15.302072+07	2026-04-01 03:53:50.288389+07
4	4	1	completed	pass	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Test Case: Login to Zing ID with Valid Credentials\nGoal: User logs in successfully and is redirected after submitting valid credentials.\n\nSteps:\n1. Navigate to https://id.zing.vn/.\n2. Enter "thanhhien18112" into the username field.\n3. Enter "Anhtoan@123" into the password field.\n4. Click the Login button.\n\nExpected Result: User logs in successfully and is redirected after submitting valid credentials.	User successfully logged in to Zing ID with the provided valid credentials and was redirected to the security settings page. The current URL is https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38 and the page displays 'Chào tbdbdbbdb' and 'Tài khoản (Zing ID): thanhhien18112'.	\N	\N	\N	2026-04-01 03:59:24.04286+07	2026-04-01 03:58:42.677068+07
5	5	1	queued	\N	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the application's homepage.\n\nSteps:\n1. Navigate to the login page.\n2. Enter a valid Gmail address into the email field.\n3. Enter the corresponding password into the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the application's homepage.	\N	\N	\N	\N	\N	2026-04-01 04:07:50.916813+07
6	6	1	failed	error	initial	{"locale": null, "headless": true, "llmModel": "gemini-2.5-flash", "maxSteps": 30, "timezone": null, "viewport": null, "useVision": true, "browserType": "chromium", "extraConfig": {}, "llmProvider": "gemini", "allowedDomains": [], "timeoutSeconds": 300}	{"id": null, "provider": "local", "profileRef": null, "profileData": {}, "profileType": "ephemeral", "profileDirectory": null}	\N	Test Case: Successful Login with Valid Credentials\nGoal: User is successfully logged in and redirected to the dashboard or homepage.\n\nSteps:\n1. Navigate to the login page (e.g., /login)\n2. Enter a valid username in the username field.\n3. Enter the correct password in the password field.\n4. Click the 'Login' button.\n\nExpected Result: User is successfully logged in and redirected to the dashboard or homepage.	\N	\N	This operation was aborted	2026-04-01 04:10:14.589732+07	2026-04-01 04:10:14.589732+07	2026-04-01 04:09:59.54203+07
\.


--
-- TOC entry 5476 (class 0 OID 19885)
-- Dependencies: 242
-- Data for Name: test_run_dataset_bindings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_run_dataset_bindings (id, test_run_id, test_run_attempt_id, dataset_id, alias, row_index, row_key, dataset_snapshot, created_at) FROM stdin;
\.


--
-- TOC entry 5489 (class 0 OID 20046)
-- Dependencies: 255
-- Data for Name: test_run_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_run_tags (test_run_id, tag_id) FROM stdin;
\.


--
-- TOC entry 5474 (class 0 OID 19849)
-- Dependencies: 240
-- Data for Name: test_runs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_runs (id, test_case_id, test_case_version_id, status, verdict, execution_log, evidence_summary, error_message, triggered_by, started_at, finished_at, created_at) FROM stdin;
1	2	2	failed	fail	{"mode": "goal_based_agent", "steps": 3, "visitedUrls": ["https://id.zing.vn/", "https://id.zing.vn/", "https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=placeholder_username&longtime=0"], "totalDurationSeconds": 16.64991545677185}	{"screenshots": 3}	\N	1	\N	2026-04-01 02:42:25.678364+07	2026-04-01 02:41:51.793485+07
2	2	2	queued	\N	\N	\N	\N	1	\N	\N	2026-04-01 03:15:36.120745+07
3	2	2	failed	fail	{"mode": "goal_based_agent", "steps": 3, "visitedUrls": ["https://id.zing.vn/", "https://id.zing.vn/", "https://id.zing.vn/v2/login/cb?apikey=92140c0e46c54994812403f564787c14&pid=38&_src=&utm_source=&utm_medium=&utm_term=&utm_content=&utm_campaign=&next=https%3A%2F%2Fid.zing.vn%2Fv2%2Finfosetting%2Fsecurity%3Fapikey%3D92140c0e46c54994812403f564787c14%26pid%3D38&referer=&err=2001&u=test_username&longtime=0"], "totalDurationSeconds": 14.588411808013916}	{"screenshots": 3}	\N	1	\N	2026-04-01 03:54:15.304428+07	2026-04-01 03:53:50.281954+07
4	2	2	completed	pass	{"mode": "goal_based_agent", "steps": 5, "visitedUrls": ["https://id.zing.vn/", "https://id.zing.vn/", "https://id.zing.vn/", "https://id.zing.vn/", "https://id.zing.vn/v2/infosetting/security?apikey=92140c0e46c54994812403f564787c14&pid=38"], "totalDurationSeconds": 25.421348094940186}	{"screenshots": 5}	\N	1	\N	2026-04-01 03:59:24.045691+07	2026-04-01 03:58:42.670243+07
5	1	1	queued	\N	\N	\N	\N	1	\N	\N	2026-04-01 04:07:50.898431+07
6	4	5	failed	error	{"mode": "dispatch_to_worker", "dispatchStatus": "failed"}	\N	This operation was aborted	1	2026-04-01 04:10:14.595545+07	2026-04-01 04:10:14.595545+07	2026-04-01 04:09:59.536571+07
\.


--
-- TOC entry 5468 (class 0 OID 19748)
-- Dependencies: 234
-- Data for Name: test_steps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_steps (id, test_case_version_id, step_order, action_type, target, input_data, expected_result, created_at) FROM stdin;
1	1	1	custom	\N	{"description": "Navigate to the login page."}	\N	2026-04-01 02:12:49.207375+07
2	1	2	custom	\N	{"description": "Enter a valid Gmail address into the email field."}	\N	2026-04-01 02:12:49.207375+07
3	1	3	custom	\N	{"description": "Enter the corresponding password into the password field."}	\N	2026-04-01 02:12:49.207375+07
4	1	4	custom	\N	{"description": "Click the 'Login' button."}	User is successfully logged in and redirected to the application's homepage.	2026-04-01 02:12:49.207375+07
9	3	1	custom	\N	{"description": "Navigate to https://id.zing.vn/."}	\N	2026-04-01 02:25:20.636868+07
10	3	2	custom	\N	{"description": "Enter {{ZING_USERNAME}} into the username field."}	\N	2026-04-01 02:25:20.636868+07
11	3	3	custom	\N	{"description": "Enter {{ZING_PASSWORD}} into the password field."}	\N	2026-04-01 02:25:20.636868+07
12	3	4	custom	\N	{"description": "Click the Login button."}	User logs in successfully and is redirected after submitting valid credentials.	2026-04-01 02:25:20.636868+07
13	2	1	custom	\N	{"description": "Navigate to https://id.zing.vn/."}	\N	2026-04-01 02:41:40.944141+07
14	2	2	custom	\N	{"description": "Enter username into the username field."}	\N	2026-04-01 02:41:40.944141+07
15	2	3	custom	\N	{"description": "Enter password into the password field."}	\N	2026-04-01 02:41:40.944141+07
16	2	4	custom	\N	{"description": "Click the Login button."}	User logs in successfully and is redirected after submitting valid credentials.	2026-04-01 02:41:40.944141+07
17	5	1	custom	\N	{"description": "Navigate to the login page (e.g., /login)"}	\N	2026-04-01 04:09:43.859657+07
18	5	2	custom	\N	{"description": "Enter a valid username in the username field."}	\N	2026-04-01 04:09:43.859657+07
19	5	3	custom	\N	{"description": "Enter the correct password in the password field."}	\N	2026-04-01 04:09:43.859657+07
20	5	4	custom	\N	{"description": "Click the 'Login' button."}	User is successfully logged in and redirected to the dashboard or homepage.	2026-04-01 04:09:43.859657+07
\.


--
-- TOC entry 5472 (class 0 OID 19799)
-- Dependencies: 238
-- Data for Name: test_tree_nodes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.test_tree_nodes (id, project_id, parent_id, node_type, name, test_case_id, dataset_id, sort_order, deleted_at, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5454 (class 0 OID 19538)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, password_hash, created_at, updated_at) FROM stdin;
1	nguyenhung.9a5.nbk@gmail.com	nguyenhung.9a5.nbk@gmail.com	$2b$10$M31UrRcA0sTmuB6xONhtcujZtKHqRs.5Sq6r2CtTXB4nuxtn3l5m6	2026-04-01 02:00:42.396295+07	2026-04-01 02:00:42.396295+07
\.


--
-- TOC entry 5569 (class 0 OID 0)
-- Dependencies: 257
-- Name: agent_runtime_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.agent_runtime_configs_id_seq', 1, true);


--
-- TOC entry 5570 (class 0 OID 0)
-- Dependencies: 259
-- Name: browser_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.browser_profiles_id_seq', 1, false);


--
-- TOC entry 5571 (class 0 OID 0)
-- Dependencies: 245
-- Name: evidences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.evidences_id_seq', 37, true);


--
-- TOC entry 5572 (class 0 OID 0)
-- Dependencies: 271
-- Name: execution_scripts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.execution_scripts_id_seq', 35, true);


--
-- TOC entry 5573 (class 0 OID 0)
-- Dependencies: 247
-- Name: failure_analyses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.failure_analyses_id_seq', 1, false);


--
-- TOC entry 5574 (class 0 OID 0)
-- Dependencies: 265
-- Name: healing_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.healing_applications_id_seq', 1, false);


--
-- TOC entry 5575 (class 0 OID 0)
-- Dependencies: 249
-- Name: healing_suggestions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.healing_suggestions_id_seq', 1, false);


--
-- TOC entry 5576 (class 0 OID 0)
-- Dependencies: 261
-- Name: project_secrets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.project_secrets_id_seq', 2, true);


--
-- TOC entry 5577 (class 0 OID 0)
-- Dependencies: 223
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projects_id_seq', 4, true);


--
-- TOC entry 5578 (class 0 OID 0)
-- Dependencies: 251
-- Name: reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reports_id_seq', 1, false);


--
-- TOC entry 5579 (class 0 OID 0)
-- Dependencies: 243
-- Name: run_step_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.run_step_logs_id_seq', 39, true);


--
-- TOC entry 5580 (class 0 OID 0)
-- Dependencies: 225
-- Name: scans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.scans_id_seq', 1, false);


--
-- TOC entry 5581 (class 0 OID 0)
-- Dependencies: 221
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- TOC entry 5582 (class 0 OID 0)
-- Dependencies: 253
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tags_id_seq', 1, false);


--
-- TOC entry 5583 (class 0 OID 0)
-- Dependencies: 235
-- Name: test_case_dataset_bindings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_case_dataset_bindings_id_seq', 1, false);


--
-- TOC entry 5584 (class 0 OID 0)
-- Dependencies: 267
-- Name: test_case_generation_batches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_case_generation_batches_id_seq', 4, true);


--
-- TOC entry 5585 (class 0 OID 0)
-- Dependencies: 269
-- Name: test_case_generation_candidates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_case_generation_candidates_id_seq', 15, true);


--
-- TOC entry 5586 (class 0 OID 0)
-- Dependencies: 231
-- Name: test_case_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_case_versions_id_seq', 5, true);


--
-- TOC entry 5587 (class 0 OID 0)
-- Dependencies: 229
-- Name: test_cases_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_cases_id_seq', 4, true);


--
-- TOC entry 5588 (class 0 OID 0)
-- Dependencies: 227
-- Name: test_datasets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_datasets_id_seq', 1, false);


--
-- TOC entry 5589 (class 0 OID 0)
-- Dependencies: 263
-- Name: test_run_attempts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_run_attempts_id_seq', 6, true);


--
-- TOC entry 5590 (class 0 OID 0)
-- Dependencies: 241
-- Name: test_run_dataset_bindings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_run_dataset_bindings_id_seq', 1, false);


--
-- TOC entry 5591 (class 0 OID 0)
-- Dependencies: 239
-- Name: test_runs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_runs_id_seq', 6, true);


--
-- TOC entry 5592 (class 0 OID 0)
-- Dependencies: 233
-- Name: test_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_steps_id_seq', 20, true);


--
-- TOC entry 5593 (class 0 OID 0)
-- Dependencies: 237
-- Name: test_tree_nodes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.test_tree_nodes_id_seq', 1, false);


--
-- TOC entry 5594 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 1, true);

SET session_replication_role = 'origin';   -- re-enable FK checks
