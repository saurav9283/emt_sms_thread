date
echo "Starting"

echo "DELETE OLD ANSWERS LOGS FOR FOOTBALL"

mysql -u visiontrek -h 5.189.166.187 -p'I@J2J$J9#q3' -D insta_alert_mtn_ng -e "DELETE FROM tbl_answers_logs WHERE DATE(processDate) < DATE(NOW())"

echo "DELETE DONE"

echo "DELETE OLD NPFL ANSWERS LOGS FOR FOOTBALL"

mysql -u visiontrek -h 5.189.166.187 -p'I@J2J$J9#q3' -D insta_alert_mtn_ng -e "DELETE FROM tbl_npfl_answers_logs WHERE DATE(processDate) < DATE(NOW())"

echo "DELETE NPFL DONE"


#  ------------ FOOTBALL QUIZ ----------- #
mysql -u visiontrek -h 5.189.166.187 -p'I@J2J$J9#q3' -D insta_alert_mtn_ng -e "INSERT INTO insta_alert_mtn_ng.tbl_sms_pending (msisdn, type_event, trxid, service, packType, STATUS, pick_date_time, processDate, processDateTime) SELECT msisdn, type_event, trxid, service, packType, 'PENDING' AS STATUS, NOW(), NOW(), NOW() FROM insta_alert_mtn_ng.tbl_subscription WHERE service LIKE 'Football%' AND type_event = 'REN' AND (msisdn NOT IN (SELECT msisdn FROM tbl_answers_logs) OR msisdn NOT IN (SELECT msisdn FROM tbl_user_answers_logs WHERE DATE(processDate) = DATE(NOW())))"

echo "FOOTBALL DONE"

echo "npfl football"
#  ------------Npfl FOOTBALL QUIZ ----------- #
mysql -u visiontrek -h 5.189.166.187 -p'I@J2J$J9#q3' -D insta_alert_mtn_ng -e "INSERT INTO insta_alert_mtn_ng.tbl_sms_pending (msisdn, type_event, trxid, service, packType, record_status, STATUS, network, pick_date_time, processDate, processDateTime) SELECT msisdn, type_event, trxid, service, packType, '0' AS record_status, 'PENDING' AS STATUS, network, NOW(), NOW(), NOW() FROM insta_alert_mtn_ng.tbl_subscription WHERE  service LIKE 'NPFL%' AND DATE(next_billed_date) > DATE(NOW()) AND msisdn NOT IN (SELECT msisdn FROM tbl_npfl_answers_logs)"

echo "npfl football done"

echo "PICK ACTIVE USER FOR GOAL ALERTS"

mysql -u visiontrek -h 5.189.166.187 -p'I@J2J$J9#q3' -D insta_alert_mtn_ng -e "INSERT INTO insta_alert_mtn_ng.tbl_sms_pending (msisdn, type_event, trxid, service, packType, record_status, STATUS, network, pick_date_time, processDate, processDateTime) SELECT msisdn, type_event, trxid, service, packType, '0' AS record_status, 'PENDING' AS STATUS, network, NOW(), NOW(), NOW() FROM insta_alert_mtn_ng.tbl_subscription WHERE  service LIKE '%Goal%' AND active = 'TRUE' AND NOT msisdn IN (SELECT msisdn FROM tbl_sms_pending WHERE service LIKE '%Goal%')"

echo "GOAL ALERT DONE"

echo "Finished"


# [path]
# /opt/app/emt_ng_sms_threads/pickNumbersForQuiz.sh > /opt/app/emt_ng_sms_threads/pickNumbersForQuiz.log
