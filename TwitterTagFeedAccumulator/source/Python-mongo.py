import sys
from datetime import datetime
from email.utils import parsedate
import time

import requests
import nltk
import twitter
from pymongo import Connection
from pymongo.errors import ConnectionFailure
from nltk import tag, re

nltk.data.path.append("/Users/Heman/Documents/workstation/Developement_Studio/Python/NLP_Corpus/nltk_data");

con_secret="FgrWE3O3eyDSBipBW818gUoeY"
con_secret_key="1XGSwChtlLBGccyM0CmdocGAvl1PsDIJBddNjRwUyOrIxiG1PH"
token="4316935092-ZvduRbjo9tUPpCetuCZahP6w5nLkfDkFFdwue4S"
token_key="jNMG2RLv8GFhx52gH2IH7pQIZxIAzjKnMXMyGMSgTZMTN"

api = twitter.Api(con_secret, con_secret_key, token, token_key)

def search_tweets(search_term):
    tweets = api.GetSearch(term=search_term, lang='en', count=5000)
    return tweets

def connect():
    """ Connect to MongoDB """
    try:
        c = Connection(host="localhost", port=27017)
    except ConnectionFailure, e:
        sys.stderr.write("Could not connect to MongoDB: %s" % e)
        sys.exit(1)
    # Get a Database handle to a database named "mydb"
    dbh = c["local"]
    # Demonstrate the db.connection property to retrieve a reference to the
    # Connection object should it go out of scope. In most cases, keeping a
    # reference to the Database object for the lifetime of your program should
    # be sufficient.
    assert dbh.connection == c
    print "Successfully set up a database handle"
    return dbh

def rectifyString(input):
    if isinstance(input, (str, unicode)) and len(input) > 1:
        return input.encode('utf-8')


def getSentiment(input):
    fail = -1;
    try:
        payload = {'apikey': 'eedc4e9599afacc062424aadf6f825bf4c313bf4','text':input, 'outputMode': 'json', 'showSourceText' :'1'}
        r = requests.post("http://gateway-a.watsonplatform.net/calls/text/TextGetTextSentiment", params=payload)
        return r.json()
    except:
        fail = 1


if __name__ == "__main__":
    dbh = connect()
    argLength = len(sys.argv) - 1

    print ("The total numbers of args passed to the script: %d " % argLength)
    if argLength >= 1:
        tweets = search_tweets(sys.argv[1]);

        for tweet in tweets:

            sentimentJson = getSentiment(rectifyString(tweet.GetText()))
            popular_words = []
            for pos_tag in tag.pos_tag(filter (lambda x:re.match("^[a-zA-Z]+$",x),[x for x in set(re.split("[\s:/,.:]", rectifyString(tweet.GetText())))])):
                if pos_tag[1] in ['NN', 'NNS', 'NNP', 'NNPS']:
                    popular_words.append(pos_tag[0])

            tweet_doc = {
                "id" : tweet.GetIdStr(),
                "search term" : sys.argv[1],
                "content" : rectifyString(tweet.GetText()),
                "creation time" : datetime.fromtimestamp(time.mktime(parsedate(rectifyString(tweet.GetCreatedAt())))),
                "retweet count" : tweet.GetRetweetCount(),
                "favourite count" : tweet.GetFavoriteCount(),
                "publishing user" : {
                    "id" : rectifyString(tweet.user.id),
                    "username" : rectifyString(tweet.user.name),
                    "description" : rectifyString(tweet.user.description),
                    "location name" : rectifyString(tweet.user.location),
                    "creation date" : datetime.fromtimestamp(time.mktime(parsedate(rectifyString(tweet.user.created_at)))),
                    "location coordinates" : tweet.geo
                },
                "publishing location" : tweet.GetGeo(),
                "popular words" : popular_words,
                "sentiment" : sentimentJson
            }
            dbh.users.insert(tweet_doc, safe=True)
            print "Successfully inserted document: %s" % tweet_doc

