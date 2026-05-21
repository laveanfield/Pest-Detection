import random


def generate_otp(length: int = 6) -> str:

    otp = ""

    for _ in range(length):
        otp += str(random.randint(0, 9))

    return otp