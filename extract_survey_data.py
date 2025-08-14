import json
import csv
import os
import glob

def extract_survey_data():
    log_files = glob.glob('backend/logs/P3_2025-08-14_03-35-09.log')
    survey_data = []
    
    for log_file in log_files:
        with open(log_file, 'r', encoding='utf-8') as f:
            for line in f:
                if 'system_survey_completed' in line:
                    try:
                        # Extract JSON part after the timestamp and log level
                        json_start = line.find('{"timestamp"')
                        if json_start != -1:
                            json_data = json.loads(line[json_start:])
                            details = json_data.get('details', {})
                            responses = details.get('responses', {})
                            
                            # Add metadata
                            row_data = {
                                'timestamp': json_data.get('timestamp'),
                                'user_id': details.get('user_id'),
                                'session_id': details.get('session_id'),
                                'system_type': details.get('system_type'),
                                'language': details.get('language'),
                                'completion_time': details.get('completion_time'),
                                'system_usage_duration': details.get('system_usage_duration'),
                                'additional_feedback': details.get('additional_feedback', '')
                            }
                            
                            # Add all response items
                            row_data.update(responses)
                            survey_data.append(row_data)
                            
                    except json.JSONDecodeError:
                        continue
    
    # Write to CSV
    if survey_data:
        fieldnames = list(survey_data[0].keys())
        with open('/workspace/prompt-class/survey_responses.csv', 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(survey_data)
        
        print(f"Extracted {len(survey_data)} survey responses to survey_responses.csv")
    else:
        print("No survey data found")

if __name__ == "__main__":
    extract_survey_data()