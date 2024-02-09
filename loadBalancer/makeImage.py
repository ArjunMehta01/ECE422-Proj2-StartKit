import json
import matplotlib.pyplot as plt
import math

f = open('data.json')

data = json.load(f)
x = data["times"]

def plotResponseTimeGraph():
    plt.plot(x, data["pastResponseTime"])
    plt.gca().set_ylim(0, max(15, math.ceil(max(data["pastResponseTime"]) + 1)))
    plt.ylabel('Response Time (s)')
    plt.xlabel('Time Since Start (mins)')
    plt.savefig('responseTime.png')
    plt.clf()

def plotServiceCount():
    plt.plot(x, data["pastServiceCount"])
    plt.gca().set_ylim([0, 9])
    plt.ylabel('Service Count')
    plt.xlabel('Time Since Start (mins)')
    plt.savefig('service.png')
    plt.clf()

def plotWorkload():
    plt.plot(x, data["pastWorkload"])
    plt.gca().set_ylim(0, max(10, math.ceil(max(data["pastWorkload"]) + 1)))
    plt.ylabel('Requests / sec')
    plt.xlabel('Time Since Start (mins)')
    plt.savefig('workload.png')
    plt.clf()

plotResponseTimeGraph()
plotServiceCount()
plotWorkload()